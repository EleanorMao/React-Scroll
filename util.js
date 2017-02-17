/**
 * Created by BG236557 on 2016/12/7.
 */
function contains(root, el) {
    if (!root || !el) return false;
    if (root.compareDocumentPosition)
        return root === el || !!(root.compareDocumentPosition(el) & 16);
    if (root.contains && el.nodeType === 1)
        return root.contains(el) && root !== el;
    while (el = el.parentNode)
        if (el === root) return true;
    return false;
}

function assign(target) {
    for (let i = 1; i < arguments.length; i++) {
        let source = arguments[i];
        for (let key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }
    return target;
}

module.exports = {contains, assign};
