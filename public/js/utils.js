const DateUtils = {
    normalizeForCanvas(input, options = {}) {
        const preserveInvalid = options && options.preserveInvalid === true;
        if (input === null || input === undefined) return null;
        if (input instanceof Date) {
            return !isNaN(input.getTime()) ? input.toISOString().slice(0, 19) + 'Z' : null;
        }
        const value = String(input).trim();
        if (!value) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T23:59:00Z`;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00Z`;
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return `${value.replace(' ', 'T')}:00Z`;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return `${value}Z`;
        if (/Z$|[+-]\d{2}:\d{2}$/.test(value)) return value;
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19) + 'Z';
        return preserveInvalid ? value : null;
    },

    formatForCanvas(value) {
        return DateUtils.normalizeForCanvas(value);
    },

    parseForCanvas(input) {
        return DateUtils.normalizeForCanvas(input, { preserveInvalid: true });
    }
};

if (typeof window !== 'undefined') window.DateUtils = DateUtils;
