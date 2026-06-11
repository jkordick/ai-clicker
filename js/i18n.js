// Minimal i18n runtime.
//
// Locales register themselves via I18n.register('en_us', { ... }).
// Strings are looked up by dot-path (e.g. 'log.gameSaved'). Missing keys
// fall back to en_us, then to the key itself so the UI never silently
// blanks out.
//
// Interpolation: t('log.builtSingle', { name: 'Intern', n: 3 }) replaces
// every {var} token in the resolved string.
//
// DOM application: any element with data-i18n="key" gets its textContent
// set on init. data-i18n-attr="attr1:key1,attr2:key2" localises arbitrary
// attributes (e.g. title, data-tooltip).
const I18n = {
    DEFAULT_LOCALE: 'en_us',
    _locale: 'en_us',
    _locales: {},

    register(code, strings) {
        this._locales[code] = strings;
    },

    setLocale(code) {
        if (this._locales[code]) this._locale = code;
    },

    getLocale() {
        return this._locale;
    },

    availableLocales() {
        return Object.keys(this._locales);
    },

    // Resolve a dot-path against an object; returns undefined if any
    // segment is missing.
    _resolve(strings, key) {
        if (!strings) return undefined;
        const parts = key.split('.');
        let cur = strings;
        for (const p of parts) {
            if (cur == null || typeof cur !== 'object') return undefined;
            cur = cur[p];
        }
        return cur;
    },

    _interpolate(template, params) {
        if (typeof template !== 'string' || !params) return template;
        return template.replace(/\{(\w+)\}/g, (_, name) =>
            params[name] != null ? String(params[name]) : `{${name}}`
        );
    },

    t(key, params) {
        let value = this._resolve(this._locales[this._locale], key);
        if (value === undefined && this._locale !== this.DEFAULT_LOCALE) {
            value = this._resolve(this._locales[this.DEFAULT_LOCALE], key);
        }
        if (value === undefined) return key;
        if (Array.isArray(value)) return value;
        return this._interpolate(value, params);
    },

    // Pull a localised array (for things like the tips rotation).
    list(key) {
        const value = this.t(key);
        return Array.isArray(value) ? value : [];
    },

    // Apply data-i18n / data-i18n-attr / data-i18n-html bindings underneath
    // `root`. Idempotent — safe to call on init or after dynamic insertion.
    applyToDOM(root = document) {
        root.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = this.t(key);
        });
        root.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (key) el.innerHTML = this.t(key);
        });
        root.querySelectorAll('[data-i18n-attr]').forEach(el => {
            const spec = el.getAttribute('data-i18n-attr');
            if (!spec) return;
            for (const pair of spec.split(',')) {
                const [attr, key] = pair.split(':').map(s => s && s.trim());
                if (attr && key) el.setAttribute(attr, this.t(key));
            }
        });
    },
};
