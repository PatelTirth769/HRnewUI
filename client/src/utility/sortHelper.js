export const getGradeLevel = (name) => {
    if (!name) return 0;
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('playgroup') || lowerName.includes('pg')) return 1;
    if (lowerName.includes('nursery') || lowerName.includes('nursary')) return 2;
    if (lowerName.includes('jr kg') || lowerName.includes('jr.kg') || lowerName.includes('jr. kg')) return 3;
    if (lowerName.includes('sr kg') || lowerName.includes('sr.kg') || lowerName.includes('sr. kg')) return 4;
    
    const match = lowerName.match(/(?:std|class|grade)\s*(\d+)/);
    if (match && match[1]) {
        return 4 + parseInt(match[1], 10);
    }
    
    return 999;
};

export const sortEducationalLevels = (a, b, getName = (item) => item) => {
    const nameA = getName(a) || '';
    const nameB = getName(b) || '';
    
    const levelA = getGradeLevel(nameA);
    const levelB = getGradeLevel(nameB);
    
    if (levelA !== levelB) {
        return levelA - levelB;
    }
    
    return nameA.localeCompare(nameB);
};
