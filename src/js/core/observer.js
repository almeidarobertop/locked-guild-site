export function createSectionObserver(callback) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            callback(entry.target);
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '200px',
    });

    return observer;
}
