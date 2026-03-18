import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Space, notification, Popconfirm, Form, Select, DatePicker, Modal, Tag, Tabs, Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import API from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function ESSWorkOnHoliday({ employeeData }) {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [holidayWork, setHolidayWork] = useState([]);
    const [historyUnavailable, setHistoryUnavailable] = useState(false);
    const [holidayDataMode, setHolidayDataMode] = useState('report');
    const [holidayDebug, setHolidayDebug] = useState({
        attendanceCount: 0,
        checkinCount: 0,
        holidayCount: 0,
        matchedCount: 0
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const lastFetchedEmployeeRef = useRef('');

    useEffect(() => {
        const currentEmployee = employeeData?.name || '';
        if (!currentEmployee) return;

        if (lastFetchedEmployeeRef.current === currentEmployee) return;
        lastFetchedEmployeeRef.current = currentEmployee;

        fetchHistory();
        fetchHolidayWork();
    }, [employeeData?.name]);

    const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const splitEmployeeText = (value) => {
        const raw = String(value || '').trim();
        if (!raw) return { code: '', name: '' };

        const parts = raw.split(':');
        const codePart = (parts[0] || '').trim();
        const namePart = parts.slice(1).join(':').trim();
        return {
            code: codePart,
            name: namePart
        };
    };

    const getRowValue = (row, keys) => {
        for (const key of keys) {
            const val = row?.[key];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
                return val;
            }
        }
        return '';
    };

    const uniqueByDate = (rows) => {
        const seen = new Set();
        return rows.filter((r) => {
            const key = `${r.work_date || ''}__${r.holiday || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const isAdminView = () => {
        try {
            const isHrAdmin = localStorage.getItem('userIsHRAdmin') === 'true';
            const userEmail = String(localStorage.getItem('user') || '').toLowerCase();
            return isHrAdmin || userEmail.includes('administrator');
        } catch {
            return false;
        }
    };

    const runHolidayReportVariants = async (filters) => {
        const attempts = [
            () => API.post('/api/method/frappe.desk.query_report.run', {
                report_name: 'Employees working on a holiday',
                filters,
                ignore_prepared_report: 1
            }),
            () => API.post('/api/method/frappe.desk.query_report.run', {
                report_name: 'Employees working on a holiday',
                filters: JSON.stringify(filters),
                ignore_prepared_report: 1
            }),
            () => {
                const params = new URLSearchParams({
                    report_name: 'Employees working on a holiday',
                    filters: JSON.stringify(filters),
                    ignore_prepared_report: '1'
                });
                return API.get(`/api/method/frappe.desk.query_report.run?${params.toString()}`);
            }
        ];

        let lastData = null;
        let lastError = null;

        for (let i = 0; i < attempts.length; i += 1) {
            try {
                const res = await attempts[i]();
                const data = res.data?.message || {};
                const result = data.result || [];
                lastData = data;

                console.log(`Holiday report variant ${i + 1} rows:`, result.length);
                if (result.length > 0) {
                    return data;
                }
            } catch (e) {
                lastError = e;
            }
        }

        if (lastData) return lastData;
        throw lastError || new Error('All holiday report variants failed');
    };

    const fetchHistory = async () => {
        if (!employeeData?.name) {
            setHistory([]);
            return;
        }

        if (historyUnavailable) {
            setHistory([]);
            return;
        }

        setLoading(true);
        try {
            // Fetching compensatory leave requests for the logged-in employee
            const res = await API.get('/api/resource/Compensatory Leave Request', {
                params: {
                    fields: JSON.stringify(["name", "work_from_date", "work_end_date", "reason", "docstatus", "status"]),
                    filters: JSON.stringify([["employee", "=", employeeData.name]]),
                    order_by: "work_from_date desc",
                    limit_page_length: 50
                }
            });
            
            const results = (res.data.data || []).map(item => ({
                ...item,
                // Status mapping: many ERPNext setups use 'status', some use 'docstatus' values
                status: item.status || (
                    item.docstatus === 1 ? 'Approved' : 
                    item.docstatus === 0 ? 'Open' : 
                    item.docstatus === 2 ? 'Cancelled' : 'Rejected'
                )
            }));
            setHistory(results);
        } catch (err) {
            console.warn("Compensatory Leave Request not accessible for this user:", err.response?.status || err.message);
            setHistory([]);
            if ([403, 404, 417].includes(err.response?.status)) {
                setHistoryUnavailable(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchHolidayWorkFromAttendance = async () => {
        if (!employeeData?.name) {
            setHolidayWork([]);
            setHolidayDataMode('fallback-empty');
            return;
        }

        try {
            const fromDate = dayjs().startOf('year').format('YYYY-MM-DD');
            const toDate = dayjs().endOf('year').format('YYYY-MM-DD');

            const attendancePromise = API.get('/api/resource/Attendance', {
                params: {
                    fields: JSON.stringify(["name", "employee", "attendance_date", "status"]),
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name],
                        ["attendance_date", ">=", fromDate],
                        ["attendance_date", "<=", toDate],
                        ["status", "=", "Present"]
                    ]),
                    order_by: "attendance_date desc",
                    limit_page_length: 500
                }
            }).catch(() => ({ data: { data: [] } }));

            const checkinPromise = API.get('/api/resource/Employee Checkin', {
                params: {
                    fields: JSON.stringify(["name", "time", "employee"]),
                    filters: JSON.stringify([
                        ["employee", "=", employeeData.name],
                        ["time", ">=", `${fromDate} 00:00:00`],
                        ["time", "<=", `${toDate} 23:59:59`]
                    ]),
                    order_by: "time desc",
                    limit_page_length: 1000
                }
            }).catch(() => ({ data: { data: [] } }));

            const holidayListPromise = employeeData?.holiday_list
                ? API.get(`/api/resource/Holiday List/${encodeURIComponent(employeeData.holiday_list)}`).catch(() => ({ data: { data: { holidays: [] } } }))
                : Promise.resolve({ data: { data: { holidays: [] } } });

            const holidayDoctypePromise = API.get('/api/resource/Holiday', {
                params: {
                    fields: JSON.stringify(["name", "holiday_date", "description", "parent"]),
                    filters: JSON.stringify([
                        ["holiday_date", ">=", fromDate],
                        ["holiday_date", "<=", toDate]
                    ]),
                    order_by: "holiday_date desc",
                    limit_page_length: 500
                }
            }).catch(() => ({ data: { data: [] } }));

            const [attendanceRes, checkinRes, holidayListRes, holidayDoctypeRes] = await Promise.all([
                attendancePromise,
                checkinPromise,
                holidayListPromise,
                holidayDoctypePromise
            ]);

            const attendanceRows = attendanceRes.data?.data || [];
            const checkinRows = checkinRes.data?.data || [];
            const holidayListRows = holidayListRes.data?.data?.holidays || [];
            const holidayDocRows = holidayDoctypeRes.data?.data || [];

            let holidays = holidayListRows;
            if (!holidays.length && holidayDocRows.length) {
                holidays = holidayDocRows;
            }

            const holidayByDate = new Map(
                holidays.map((h) => [
                    dayjs(h.holiday_date).format('YYYY-MM-DD'),
                    h.description || 'Holiday'
                ])
            );

            const attendanceMatched = attendanceRows
                .filter((row) => {
                    const d = dayjs(row.attendance_date).format('YYYY-MM-DD');
                    return holidayByDate.has(d);
                })
                .map((row, idx) => {
                    const d = dayjs(row.attendance_date).format('YYYY-MM-DD');
                    return {
                        key: `fallback-${idx}`,
                        employee: row.employee || employeeData.name,
                        work_date: d,
                        holiday: holidayByDate.get(d),
                        status: row.status || 'Present'
                    };
                });

            const checkinByDate = new Map();
            checkinRows.forEach((r) => {
                const d = dayjs(r.time).format('YYYY-MM-DD');
                if (!checkinByDate.has(d)) {
                    checkinByDate.set(d, true);
                }
            });

            const checkinMatched = Array.from(checkinByDate.keys())
                .filter((d) => holidayByDate.has(d))
                .map((d, idx) => ({
                    key: `checkin-${idx}`,
                    employee: employeeData.name,
                    work_date: d,
                    holiday: holidayByDate.get(d),
                    status: 'Present'
                }));

            const workedOnHoliday = uniqueByDate([...attendanceMatched, ...checkinMatched]);

            console.log('Fallback holiday-work rows from Attendance:', workedOnHoliday);
            setHolidayWork(workedOnHoliday);
            setHolidayDataMode(workedOnHoliday.length ? 'fallback' : 'fallback-empty');
            setHolidayDebug({
                attendanceCount: attendanceRows.length,
                checkinCount: checkinRows.length,
                holidayCount: holidays.length,
                matchedCount: workedOnHoliday.length
            });
        } catch (fallbackErr) {
            console.error('Fallback from Attendance also failed:', fallbackErr);
            setHolidayWork([]);
            setHolidayDataMode('fallback-failed');
        }
    };

    const fetchHolidayWork = async () => {
        try {
            if (!employeeData?.name) {
                setHolidayWork([]);
                setHolidayDataMode('report-empty');
                return;
            }

            const baseFilters = {
                from_date: dayjs().startOf('year').format('YYYY-MM-DD'),
                to_date: dayjs().endOf('year').format('YYYY-MM-DD')
            };

            if (employeeData?.company) {
                baseFilters.company = employeeData.company;
            }

            const payload = {
                report_name: "Employees working on a holiday",
                filters: baseFilters
            };
            
            console.log("Fetching Holiday Work Report with payload:", payload);
            let reportData = await runHolidayReportVariants(baseFilters);
            let reportColumns = reportData.columns || [];
            let reportResult = reportData.result || [];

            // Some tenants have company naming mismatch vs Employee.company; retry once without company.
            if ((!reportResult || !reportResult.length) && baseFilters.company) {
                const retryPayload = {
                    report_name: "Employees working on a holiday",
                    filters: {
                        from_date: baseFilters.from_date,
                        to_date: baseFilters.to_date
                    }
                };
                console.log("Holiday report empty with company filter, retrying without company:", retryPayload);
                reportData = await runHolidayReportVariants(retryPayload.filters);
                reportColumns = reportData.columns || [];
                reportResult = reportData.result || [];
            }

            if (reportResult.length > 0) {
                console.log("Work on Holiday Report Raw Result (First Row):", reportResult[0]);
                
                const rows = reportResult.map((row, idx) => {
                    let rowObj = { key: idx };
                    if (Array.isArray(row)) {
                        reportColumns.forEach((col, i) => {
                            const label = typeof col === 'string' ? col.split(':')[0] : (col.fieldname || col.id || col.label || col.title || `col_${i}`);
                            const normalizedLabel = String(label).trim().toLowerCase().replace(/\s+/g, '_');
                            rowObj[label] = row[i];
                            rowObj[normalizedLabel] = row[i];
                        });

                        // Preserve commonly expected keys even when report columns are label-only.
                        if (!rowObj.employee && row[0] !== undefined) rowObj.employee = row[0];
                        if (!rowObj.work_date && row[1] !== undefined) rowObj.work_date = row[1];
                        if (!rowObj.status && row[2] !== undefined) rowObj.status = row[2];
                        if (!rowObj.holiday && row[3] !== undefined) rowObj.holiday = row[3];
                    } else {
                        rowObj = { ...row, key: idx };
                    }
                    return rowObj;
                });

                const myWork = rows.filter(row => {
                    const rowEmployeeRaw = getRowValue(row, [
                        'employee', 'Employee', 'employee_id', 'employee_name', 'Employee_Name',
                        'employee_code', 'employee_details', 'employee_label'
                    ]);
                    const parsed = splitEmployeeText(rowEmployeeRaw);

                    const rowEmpNormalized = normalizeText(rowEmployeeRaw);
                    const rowCodeNormalized = normalizeText(parsed.code);
                    const rowNameNormalized = normalizeText(parsed.name);

                    const targetIdNormalized = normalizeText(employeeData?.name);
                    const targetNameNormalized = normalizeText(employeeData?.employee_name);

                    if (!targetIdNormalized && !targetNameNormalized) return false;

                    return (
                        (targetIdNormalized && (rowEmpNormalized.includes(targetIdNormalized) || rowCodeNormalized.includes(targetIdNormalized))) ||
                        (targetNameNormalized && (rowEmpNormalized.includes(targetNameNormalized) || rowNameNormalized.includes(targetNameNormalized)))
                    );
                }).map(row => {
                    const rawDate = getRowValue(row, ['work_date', 'Date', 'date', 'attendance_date']);
                    let parsedDate = dayjs(rawDate);
                    if (!parsedDate.isValid() && String(rawDate).match(/^\d{2}-\d{2}-\d{4}$/)) {
                        parsedDate = dayjs(rawDate, 'DD-MM-YYYY');
                    }

                    return {
                        ...row,
                        work_date: parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD') : rawDate,
                        holiday: getRowValue(row, ['holiday', 'Holiday', 'holiday_name', 'holiday_list']),
                        status: getRowValue(row, ['status', 'Status', 'attendance_status']) || 'Present'
                    };
                });

                const reportRowsMapped = rows.map((row) => {
                    const rawDate = getRowValue(row, ['work_date', 'Date', 'date', 'attendance_date']);
                    let parsedDate = dayjs(rawDate);
                    if (!parsedDate.isValid() && String(rawDate).match(/^\d{2}-\d{2}-\d{4}$/)) {
                        parsedDate = dayjs(rawDate, 'DD-MM-YYYY');
                    }
                    return {
                        ...row,
                        work_date: parsedDate.isValid() ? parsedDate.format('YYYY-MM-DD') : rawDate,
                        holiday: getRowValue(row, ['holiday', 'Holiday', 'holiday_name', 'holiday_list']),
                        status: getRowValue(row, ['status', 'Status', 'attendance_status']) || 'Present'
                    };
                });

                const effectiveRows = (myWork.length === 0 && isAdminView()) ? reportRowsMapped : myWork;
                
                console.log("Filtered Work on Holiday:", myWork);
                if (myWork.length === 0 && isAdminView() && reportRowsMapped.length > 0) {
                    console.log('Admin view enabled: showing unfiltered report rows.');
                    setHolidayDataMode('report-admin');
                } else {
                    setHolidayDataMode('report');
                }
                setHolidayWork(effectiveRows);
                setHolidayDebug({
                    attendanceCount: 0,
                    checkinCount: 0,
                    holidayCount: 0,
                    matchedCount: effectiveRows.length
                });
            } else {
                console.warn("Holiday report returned no results for filters:", payload.filters);
                setHolidayWork([]);
                setHolidayDataMode('report-empty');
            }
        } catch (err) {
            console.error("Failed to fetch holiday work report:", err);
            if (err.response?.status === 403) {
                await fetchHolidayWorkFromAttendance();
                notification.warning({ 
                    message: "Using Attendance Fallback", 
                    description: "ERPNext denied report access, so holiday work is being derived from your Attendance + Holiday List." 
                });
            } else {
                setHolidayWork([]);
                setHolidayDataMode('report-failed');
            }
        }
    };

    const handleApply = async (values) => {
        setSubmitting(true);
        try {
            const payload = {
                employee: employeeData.name,
                work_from_date: values.date.format('YYYY-MM-DD'),
                work_end_date: values.date.format('YYYY-MM-DD'),
                reason: values.reason,
                leave_type: "Compensatory Off", // Default for most HRMS setups
                doctype: "Compensatory Leave Request"
            };
            await API.post('/api/resource/Compensatory Leave Request', payload);
            notification.success({ message: "Request submitted successfully" });
            setIsModalOpen(false);
            form.resetFields();
            fetchHistory();
        } catch (err) {
            console.error("Failed to submit request:", err);
            notification.error({ 
                message: "Failed to submit request", 
                description: err.response?.data?.message || err.message 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (name) => {
        try {
            await API.delete(`/api/resource/Compensatory Leave Request/${encodeURIComponent(name)}`);
            notification.success({ message: "Request deleted" });
            fetchHistory();
        } catch (err) {
            notification.error({ message: "Delete failed" });
        }
    };

    const historyColumns = [
        { title: 'ID', dataIndex: 'name', key: 'name', render: (id) => <span className="text-blue-600">{id}</span> },
        { title: 'Date', dataIndex: 'work_from_date', render: d => d ? dayjs(d).format('DD MMM YYYY') : '-' },
        { title: 'Reason', dataIndex: 'reason' },
        { title: 'Status', dataIndex: 'status', render: s => (
            <Tag color={s === 'Approved' ? 'green' : s === 'Open' ? 'blue' : 'orange'}>{s}</Tag>
        )},
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => record.status === 'Open' && (
                <Popconfirm title="Delete this request?" onConfirm={() => handleDelete(record.name)}>
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
            )
        }
    ];

    const reportColumns = [
        { title: 'Date', dataIndex: 'work_date', render: d => d ? dayjs(d).format('DD MMM YYYY') : '-' },
        { title: 'Holiday', dataIndex: 'holiday' },
        { title: 'Status', render: () => <Tag color="orange">Holiday Worked</Tag> },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button 
                    type="link" 
                    size="small" 
                    onClick={() => {
                        form.setFieldsValue({ 
                            date: dayjs(record.work_date), 
                            reason: `Worked on holiday: ${record.holiday || ''}` 
                        });
                        setIsModalOpen(true);
                    }}
                >
                    Request Comp-Off
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-gray-500 italic">Manage your holiday work records and compensatory leave requests</div>
                <Space>
                    <Button 
                        onClick={() => { fetchHistory(); fetchHolidayWork(); }} 
                        icon={<span className="inline-block animate-spin-hover">⟳</span>}
                        size="small"
                        title="Refresh Data"
                    />
                    <Button 
                        type="primary" 
                        onClick={() => setIsModalOpen(true)} 
                        icon={<PlusOutlined />} 
                        className="bg-orange-500 border-none hover:bg-orange-600 h-8 flex items-center"
                    >
                        New Request
                    </Button>
                </Space>
            </div>

            <Tabs defaultActiveKey="1" items={[
                {
                    key: '1',
                    label: 'My Requests',
                    children: (
                        <div className="bg-white border rounded-lg overflow-hidden">
                            <Table 
                                columns={historyColumns} 
                                dataSource={history} 
                                loading={loading} 
                                rowKey="name" 
                                size="middle"
                                className="ess-table"
                                locale={{ emptyText: historyUnavailable ? 'Compensatory Leave Request is not accessible for your role.' : 'No requests found.' }}
                            />
                        </div>
                    )
                },
                {
                    key: '2',
                    label: 'Potential Comp-Offs (from Holiday Report)',
                    children: (
                        <div className="bg-white border rounded-lg overflow-hidden">
                            {holidayDataMode !== 'report' && (
                                <div className="px-3 py-2 text-xs border-b bg-amber-50 text-amber-800">
                                    {holidayDataMode === 'report-admin' && `Admin mode: showing ${holidayDebug.matchedCount} row(s) directly from report (employee filter bypassed).`}
                                    {holidayDataMode === 'fallback' && `Showing fallback data (Attendance/Checkin). Matched ${holidayDebug.matchedCount} holiday-work day(s).`}
                                    {holidayDataMode === 'fallback-empty' && `Fallback checked Attendance (${holidayDebug.attendanceCount}), Checkin (${holidayDebug.checkinCount}), Holidays (${holidayDebug.holidayCount}) but found no worked-holiday matches.`}
                                    {holidayDataMode === 'fallback-failed' && 'Fallback fetch failed due ERP permission/config restrictions.'}
                                    {holidayDataMode === 'report-empty' && 'Report ran successfully but returned no rows for the selected filters.'}
                                    {holidayDataMode === 'report-failed' && 'Report request failed before fallback could run.'}
                                </div>
                            )}
                            <Table 
                                columns={reportColumns} 
                                dataSource={holidayWork} 
                                rowKey={(r) => r.work_date + r.holiday} 
                                size="middle"
                                className="ess-table"
                                locale={{
                                    emptyText:
                                        holidayDataMode === 'fallback-empty'
                                            ? 'No holiday-work match found from Attendance + Holiday data.'
                                            : holidayDataMode === 'fallback-failed'
                                                ? 'Fallback failed: check ERP permissions for Attendance, Checkin, and Holiday doctypes.'
                                                : 'No holiday work records found in ERPNext report.'
                                }}
                            />
                        </div>
                    )
                }
            ]} />

            <Modal
                title="Request Compensatory Off"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form form={form} layout="vertical" onFinish={handleApply} className="mt-4">
                    <Form.Item name="date" label="Work Date" rules={[{ required: true }]}>
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item name="reason" label="Reason/Work Done" rules={[{ required: true }]}>
                        <TextArea rows={3} placeholder="Please describe the work done on this holiday" />
                    </Form.Item>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={submitting} 
                            className="bg-orange-500 border-none hover:bg-orange-600"
                        >
                            Submit Request
                        </Button>
                    </div>
                </Form>
            </Modal>

            <style dangerouslySetInnerHTML={{ __html: `
                .ess-table .ant-table-thead > tr > th { background: #fffcf9 !important; font-size: 11px; color: #9a3412; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #ffedd5 !important; }
                .ess-table .ant-table-cell { font-size: 13px; }
                .animate-spin-hover:hover { transform: rotate(180deg); transition: transform 0.3s; }
            `}} />
        </div>
    );
}
