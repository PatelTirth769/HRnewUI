var _ = require('underscore');

module.exports = {
    titles: {
        objective: ['objective', 'objectives', 'career objective', 'career objectives'],
        summary: ['summary', 'professional summary', 'executive summary', 'profile summary', 'about me', 'profile'],
        technology: ['technology', 'technologies', 'technical skills'],
        experience: ['experience', 'work experience', 'employment history', 'professional experience', 'work history'],
        education: ['education', 'academic', 'academics', 'educational background', 'educational qualifications'],
        skills: ['skills', 'Skills & Expertise', 'technology', 'technologies', 'technical skills', 'key skills', 'core competencies', 'competencies'],
        languages: ['languages', 'language proficiency'],
        courses: ['courses', 'training', 'trainings'],
        projects: ['projects', 'project details', 'key projects', 'academic projects'],
        links: ['links'],
        contacts: ['contacts', 'contact information', 'contact details'],
        positions: ['positions', 'position'],
        profiles: ['profiles', 'social connect', 'social-profiles', 'social profiles', 'online profiles'],
        awards: ['awards', 'achievements', 'accomplishments'],
        honors: ['honors', 'honours'],
        additional: ['additional', 'additional information', 'other information'],
        certification: ['certification', 'certifications', 'certificates'],
        interests: ['interests', 'hobbies', 'hobbies and interests'],
        declaration: ['declaration'],
        references: ['references'],
        strengths: ['strengths', 'personal strengths'],
    },
    profiles: [
        'github.com',
        'linkedin.com',
        'facebook.com',
        'bitbucket.org',
        'stackoverflow.com',
    ],
    inline: {
        skype: 'skype',
    },
    regular: {
        name: [/([A-Z][a-z]+)(\s[A-Z][a-z]+)(\s[A-Z][a-z]+)?/],
        email: [/([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})/i],
        phone: [/((?:\+?\d{1,3}[\s\-]?)?\(?\d{2,3}\)?[\s.\-]?\d{3,4}[\s.\-]?\d{3,5})/],
    },
};
