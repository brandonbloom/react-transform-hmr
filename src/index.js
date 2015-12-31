import { getForceUpdate, createProxy } from 'react-proxy';
import window from 'global/window';

let componentProxies;
if (window.__reactComponentProxies) {
  componentProxies = window.__reactComponentProxies;
} else {
  componentProxies = {};
  Object.defineProperty(window, '__reactComponentProxies', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: componentProxies
  });
}

export default function proxyReactComponents({ filename, components, imports, locals }) {
  const [React] = imports;

  if (!React.Component) {
    throw new Error(
      'imports[0] for react-transform-hmr does not look like React.'
    );
  }

  const forceUpdate = getForceUpdate(React);

  return function wrapWithProxy(ReactClass, uniqueId) {
    const {
      isInFunction = false,
      displayName = uniqueId
    } = components[uniqueId];

    if (isInFunction) {
      return ReactClass;
    }

    const globalUniqueId = filename + '$' + uniqueId;
    if (componentProxies[globalUniqueId]) {
      console.info('[React Transform HMR] Patching ' + displayName);
      const instances = componentProxies[globalUniqueId].update(ReactClass);
      setTimeout(() => instances.forEach(forceUpdate));
    } else {
      componentProxies[globalUniqueId] = createProxy(ReactClass);
    }

    return componentProxies[globalUniqueId].get();
  };
}
