/**
 * Check if an object is 'empty'.
 *
 * @param object $o The object to check.o
 * @return bool True if the object is empty.
 */
export let isEmpty = (o) => {
    return (
        o === null ||
        o === undefined ||
        o === '' ||
        o === 'null' ||
        (Array.isArray(o) && o.length === 0) ||
        (typeof o === 'object' &&
            o.constructor.name === 'Object' &&
            Object.getOwnPropertyNames(o).length === 0)
    );
};

/**
 * Returns a promise that resolves after a given number of milliseconds.
 */
export let sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
