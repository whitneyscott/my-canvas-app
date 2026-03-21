const DateUtils = {
    formatForCanvas(value) {
        if (value === null || value === undefined || value === '') return null;
        try {
            const d = new Date(value);
            return !isNaN(d.getTime()) ? d.toISOString().slice(0, 19) + 'Z' : null;
        } catch { return null; }
    },

    parseForCanvas(input) {
        if (input === null || input === undefined) return null;
        const value = String(input).trim();
        if (!value) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T23:59:00Z`;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00Z`;
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return `${value.replace(' ', 'T')}:00Z`;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return `${value}Z`;
        if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) return value;
        const d = new Date(value);
        return !isNaN(d.getTime()) ? d.toISOString().slice(0, 19) + 'Z' : value;
    }
};

if (typeof window !== 'undefined') window.DateUtils = DateUtils;
