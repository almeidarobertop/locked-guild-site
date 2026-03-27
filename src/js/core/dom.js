export const $ = (id) => document.getElementById(id);

export const $$ = (selector, scope = document) =>
    scope.querySelectorAll(selector);

export const create = (tag, className) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
};
