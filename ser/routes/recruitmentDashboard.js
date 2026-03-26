const express = require('express');
const axios = require('axios');
const router = express.Router();
const { db } = require('../firebase');

// Helper to get system URL
async function getSystemUrl(code) {
    try {
        const snapshot = await db.collection('systems').where('code', '==', code).get();
        if (snapshot.empty) return null;
        return snapshot.docs[0].data().erpNextUrl;
    } catch (err) {
        console.error("Error getting system URL:", err);
        return null;
    }
}

router.get('/', async (req, res) => {
    try {
        const { Company, systemCode = 'preeshe', date } = req.query;
        const targetBase = await getSystemUrl(systemCode);

        console.log(`[Recruitment Dashboard] Request received: system=${systemCode}, company=${Company}, date=${date||'current'}`);

        if (!targetBase) {
            console.error(`[Recruitment Dashboard] Target system not found: ${systemCode}`);
            return res.status(404).json({ message: `System "${systemCode}" not found` });
        }

        const headers = { Cookie: req.headers.cookie };
        const axiosConfig = { headers };

        // Define filters for API calls
        let baseFilters = [];
        if (Company) baseFilters.push(["company", "=", Company]);

        // Define specific filters for current month
        const now = date ? new Date(date) : new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        // 1. Fetch Job Openings
        let jobOpeningFilters = [...baseFilters]; // Add status open if needed, e.g., ["status", "=", "Open"]
        const jobOpeningsPromise = axios.get(`${targetBase}/api/resource/Job Opening`, {
            params: {
                fields: JSON.stringify(["name", "status", "creation", "designation"]),
                filters: JSON.stringify(jobOpeningFilters),
                limit_page_length: 5000
            },
            ...axiosConfig
        }).catch(err => { console.error("Error fetching Job Openings:", err.message); return { data: { data: [] }}; });

        // 2. Fetch Job Applicants
        const jobApplicantsPromise = axios.get(`${targetBase}/api/resource/Job Applicant`, {
            params: {
                fields: JSON.stringify(["name", "status", "creation", "modified", "job_title"]),
                limit_page_length: 5000
            },
            ...axiosConfig
        }).then(res => { console.log("Job Applicants Fetch Success, count:", res.data?.data?.length); return res; })
          .catch(err => { console.error("Error fetching Job Applicants:", err.response?.data || err.message); return { data: { data: [] }}; });

        // 3. Fetch Job Offers
        const jobOffersPromise = axios.get(`${targetBase}/api/resource/Job Offer`, {
            params: {
                // Fetch all offers to match ERPNext dashboard behavior
                fields: JSON.stringify(["name", "status", "creation", "modified", "applicant_name", "designation", "company"]),
                limit_page_length: 5000
            },
            ...axiosConfig
        }).catch(err => { console.error("Error fetching Job Offers:", err.message); return { data: { data: [] }}; });

        // Wait for all promises
        const [openingsRes, applicantsRes, offersRes] = await Promise.all([
            jobOpeningsPromise, 
            jobApplicantsPromise, 
            jobOffersPromise
        ]);

        const jobOpenings = openingsRes.data?.data || [];
        let jobApplicantsRaw = applicantsRes.data?.data || [];
        if (Company && jobOpenings.length > 0) {
            const validJobOpeningNames = new Set(jobOpenings.map(jo => jo.name));
            jobApplicantsRaw = jobApplicantsRaw.filter(app => validJobOpeningNames.has(app.job_title));
        } else if (Company) {
            jobApplicantsRaw = [];
        }
        const jobApplicants = jobApplicantsRaw;
        const jobOffers = offersRes.data?.data || [];

        // --- CALCULATIONS ---
        
        // Job Openings (Open status)
        const openJobOpenings = jobOpenings.filter(op => op.status === 'Open' || op.status === 'In Progress').length;
        
        // Fix: Use local month/year prefix to avoid UTC shift backward to previous month
        const prefixMonth = (now.getMonth() + 1).toString().padStart(2, '0');
        const targetPrefix = `${now.getFullYear()}-${prefixMonth}`;
        
        // Total Applicants (This Month) - count across ALL companies to match ERPNext
        const allApplicants = applicantsRes.data?.data || [];
        const applicantsThisMonth = allApplicants.filter(app => {
            const dateStr = app.creation;
            if (!dateStr) return false;
            return dateStr.startsWith(targetPrefix);
        }).length;

        // Accepted / Rejected Applicants - count across ALL companies to match ERPNext
        const acceptedApplicants = allApplicants.filter(app => app.status === 'Accepted').length;
        const rejectedApplicants = allApplicants.filter(app => app.status === 'Rejected').length;

        // Job Offers (This month)
        // Job Offers (This month) - count across ALL companies to match ERPNext
        const allJobOffers = jobOffers;
        const offersThisMonth = allJobOffers.filter(offer => {
            const dateStr = offer.creation;
            if (!dateStr) return false;
            return dateStr.startsWith(targetPrefix);
        }).length;

        // Applicant to Hire Percentage
        const totalApplicantsForRate = allApplicants.length;
        const applicantToHirePercentage = totalApplicantsForRate > 0 
            ? ((acceptedApplicants / totalApplicantsForRate) * 100).toFixed(1) 
            : 0;

        // Job Offer Acceptance Rate - only count Accepted vs Rejected to match ERPNext
        // Job Offer Acceptance Rate - only count Accepted vs Rejected to match ERPNext
        const totalOffersRel = allJobOffers.filter(o => ['Accepted', 'Rejected'].includes(o.status)).length;
        const acceptedOffers = allJobOffers.filter(offer => offer.status === 'Accepted').length;
        const jobOfferAcceptanceRate = totalOffersRel > 0 
            ? ((acceptedOffers / totalOffersRel) * 100).toFixed(0) 
            : 100; // ERPNext defaults to 100% if no rejections

        // --- TREND CALCULATIONS ---
        // ERPNext trends for cumulative metrics usually show (This Month additions / Previous Total)
        const applicantsCreatedThisMonth = allApplicants.filter(app => (app.creation || '').startsWith(targetPrefix)).length;
        const totalApplicantsPrev = allApplicants.length - applicantsCreatedThisMonth;
        const applicantTrend = totalApplicantsPrev > 0 ? ((applicantsCreatedThisMonth / totalApplicantsPrev) * 100).toFixed(1) : 0;

        const acceptedCreatedThisMonth = allApplicants.filter(app => app.status === 'Accepted' && (app.creation || '').startsWith(targetPrefix)).length;
        const totalAcceptedPrev = acceptedApplicants - acceptedCreatedThisMonth;
        const acceptedTrend = totalAcceptedPrev > 0 ? ((acceptedCreatedThisMonth / totalAcceptedPrev) * 100).toFixed(1) : 0;

        const rejectedCreatedThisMonth = allApplicants.filter(app => app.status === 'Rejected' && (app.creation || '').startsWith(targetPrefix)).length;
        const totalRejectedPrev = rejectedApplicants - rejectedCreatedThisMonth;
        const rejectedTrend = totalRejectedPrev > 0 ? ((rejectedCreatedThisMonth / totalRejectedPrev) * 100).toFixed(1) : 0;

        const timeToFillStr = 0; // Placeholder for now

        // Job Openings Trend (New this month / previous total) - Filtered by company
        const openingsCreatedThisMonth = jobOpenings.filter(op => (op.creation || '').startsWith(targetPrefix)).length;
        const totalOpeningsPrev = jobOpenings.length - openingsCreatedThisMonth;
        const jobOpeningsTrend = totalOpeningsPrev > 0 ? ((openingsCreatedThisMonth / totalOpeningsPrev) * 100).toFixed(0) : 0;

        // Job Offers Trend (Cumulative growth)
        const offersCreatedThisMonth = allJobOffers.filter(off => (off.creation || '').startsWith(targetPrefix)).length;
        const totalOffersPrev = allJobOffers.length - offersCreatedThisMonth;
        const jobOffersTrend = totalOffersPrev > 0 ? ((offersCreatedThisMonth / totalOffersPrev) * 100).toFixed(0) : 0;

        const expectedPayload = {
            jobOpenings: {
                value: openJobOpenings || jobOpenings.length, // Fallback to all if none open
                trend: `${jobOpeningsTrend > 0 ? '↑' : '↓'} ${Math.abs(jobOpeningsTrend)}% since last month`
            },
            totalApplicants: {
                value: applicantsThisMonth,
                trend: `${applicantTrend > 0 ? '↑' : '↓'} ${Math.abs(applicantTrend)}% since last month`
            },
            acceptedApplicants: {
                value: acceptedApplicants,
                trend: `${acceptedTrend > 0 ? '↑' : '↓'} ${Math.abs(acceptedTrend)}% since last month`
            },
            rejectedApplicants: {
                value: rejectedApplicants,
                trend: `${rejectedTrend > 0 ? '↑' : '↓'} ${Math.abs(rejectedTrend)}% since last month`
            },
            jobOffers: {
                value: offersThisMonth,
                trend: `${jobOffersTrend > 0 ? '↑' : '↓'} ${Math.abs(jobOffersTrend)}% since last month`
            },
            applicantToHirePercentage: {
                value: `${applicantToHirePercentage}%`
            },
            jobOfferAcceptanceRate: {
                value: `${jobOfferAcceptanceRate}%`
            },
            timeToFill: {
                value: timeToFillStr
            }
        };

        res.json(expectedPayload);
    } catch (error) {
        console.error("Error generating Recruitment Dashboard data:", error.message);
        res.status(500).json({ 
            message: "Error fetching recruitment dashboard data", 
            detail: error.message
        });
    }
});

module.exports = router;
