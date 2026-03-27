const DateUtils = {
    normalizeForCanvas(input) {
        if (input === null || input === undefined) return null;
        if (input instanceof Date) {
            return !isNaN(input.getTime()) ? input.toISOString().slice(0, 19) + 'Z' : null;
        }
        if (typeof input === 'number' && Number.isFinite(input)) {
            const d = new Date(input);
            return !isNaN(d.getTime()) ? d.toISOString().slice(0, 19) + 'Z' : null;
        }
        const value = String(input).trim();
        if (!value) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T23:59:00Z`;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00Z`;
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return `${value.replace(' ', 'T')}:00Z`;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return `${value}Z`;
        if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) return value;
        if (/^\d+$/.test(value)) {
            const n = Number(value);
            if (Number.isFinite(n)) {
                const ms = value.length <= 10 ? n * 1000 : n;
                const d = new Date(ms);
                return !isNaN(d.getTime()) ? d.toISOString().slice(0, 19) + 'Z' : null;
            }
        }
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19) + 'Z';
        return null;
    },

    formatForCanvas(value) {
        return DateUtils.normalizeForCanvas(value);
    },

    parseForCanvas(input) {
        return DateUtils.normalizeForCanvas(input);
    }
};

if (typeof window !== 'undefined') window.DateUtils = DateUtils;
