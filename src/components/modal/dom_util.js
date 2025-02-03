// https://github.com/davidtheclark/tabbable/blob/master/index.js
export const isDocumentElement = (node) =>
  node === node.ownerDocument.documentElement;
export const getStyle = (element) =>
  elementToOwnerWindow(element).getComputedStyle(element);
export const getStyleValue = (element, name) =>
  getStyle(element).getPropertyValue(name);
export const setStyle = (element, name, value) => {
  const prevValue = element.style[name];
  if (prevValue) {
    element.style.setProperty(name, value);
    return () => {
      element.style.setProperty(name, prevValue);
    };
  }
  element.style.setProperty(name, value);
  return () => {
    element.style.removeProperty(name);
  };
};
export const setStyles = (element, styleDescription) => {
  const cleanupCallbackSet = new Set();
  for (const name of Object.keys(styleDescription)) {
    const value = styleDescription[name];
    const removeStyle = setStyle(element, name, value);
    cleanupCallbackSet.add(removeStyle);
  }
  return () => {
    for (const cleanupCallback of cleanupCallbackSet) {
      cleanupCallback();
    }
    cleanupCallbackSet.clear();
  };
};

/**
 * elementToOwnerWindow returns the window owning the element.
 * Usually an element window will just be window.
 * But when an element is inside an iframe, the window of that element
 * is iframe.contentWindow
 * It's often important to work with the correct window because
 * element are scoped per iframes.
 */
export const elementToOwnerWindow = (element) => {
  if (elementIsWindow(element)) {
    return element;
  }
  if (elementIsDocument(element)) {
    return element.defaultView;
  }
  return elementToOwnerDocument(element).defaultView;
};
/**
 * elementToOwnerDocument returns the document containing the element.
 * Usually an element document is window.document.
 * But when an element is inside an iframe, the document of that element
 * is iframe.contentWindow.document
 * It's often important to work with the correct document because
 * element are scoped per iframes.
 */
export const elementToOwnerDocument = (element) => {
  if (elementIsWindow(element)) {
    return element.document;
  }
  if (elementIsDocument(element)) {
    return element;
  }
  return element.ownerDocument;
};

export const elementIsWindow = (a) => a.window === a;
export const elementIsDocument = (a) => a.nodeType === 9;
export const elementIsIframe = ({ nodeName }) => nodeName === "IFRAME";
