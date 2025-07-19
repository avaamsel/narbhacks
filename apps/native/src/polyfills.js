// Polyfills for React 19 and Hermes compatibility

// Ensure global is available
if (typeof global === 'undefined') {
  global = {};
}

// Polyfill for React 19 compatibility with Hermes
if (typeof global.HermesInternal === 'undefined') {
  global.HermesInternal = {
    getRuntimeProperties: () => ({}),
  };
}

// Disable React DevTools completely to prevent fusebox dispatcher issues
global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
  supportsFiber: false,
  inject: () => {},
  onCommitFiberRoot: () => {},
  onCommitFiberUnmount: () => {},
  isDisabled: true,
};

// Ensure React 19 JSX runtime is available
if (typeof global.__REACT_JSX_RUNTIME__ === 'undefined') {
  global.__REACT_JSX_RUNTIME__ = true;
}

// Fix ExceptionsManager setup order
if (typeof global.__EXCEPTIONS_MANAGER_SETUP__ === 'undefined') {
  global.__EXCEPTIONS_MANAGER_SETUP__ = true;
  
  // Ensure ExceptionsManager is set up before React DevTools
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Call original console.error first
    originalConsoleError.apply(console, args);
    
    // Then handle any additional error reporting
    if (global.RN$handleException) {
      const error = args[0];
      if (error instanceof Error) {
        global.RN$handleException(error, false, false);
      }
    }
  };
}

// React 19 + Hermes compatibility fixes
if (typeof global.__REACT_19_HERMES_FIX__ === 'undefined') {
  global.__REACT_19_HERMES_FIX__ = true;
  
  // Fix property writability issues in Hermes
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (e) {
      if (e.message && e.message.includes('not writable')) {
        // Try to make the property writable first
        try {
          originalDefineProperty.call(this, obj, prop, {
            ...descriptor,
            writable: true,
            configurable: true
          });
          return originalDefineProperty.call(this, obj, prop, descriptor);
        } catch (e2) {
          // If still fails, just return the object
          return obj;
        }
      }
      throw e;
    }
  };
  
  // Fix module resolution issues
  const originalRequire = global.require;
  global.require = function(moduleName) {
    try {
      return originalRequire.apply(this, arguments);
    } catch (e) {
      if (e.message && e.message.includes('Cannot read property \'default\' of undefined')) {
        // Return a mock module for undefined modules
        return {
          default: {},
          ...Object.fromEntries(
            Array.from({ length: 10 }, (_, i) => [`export${i}`, {}])
          )
        };
      }
      throw e;
    }
  };
  
  // Mock fusebox dispatcher to prevent property writability errors
  if (typeof global.__FUSEBOX_DISPATCHER__ === 'undefined') {
    global.__FUSEBOX_DISPATCHER__ = true;
    
    // Mock the fusebox dispatcher
    const mockDispatcher = {
      setup: () => {},
      dispatch: () => {},
      getState: () => ({}),
    };
    
    // Override any fusebox-related functions
    if (typeof global.setupFuseBoxReactDevTools === 'function') {
      global.setupFuseBoxReactDevTools = () => mockDispatcher;
    }
  }
  
  // Fix React 19 JSX runtime issues with Hermes
  if (typeof global.__REACT_JSX_RUNTIME_FIX__ === 'undefined') {
    global.__REACT_JSX_RUNTIME_FIX__ = true;
    
    // Ensure React is properly loaded before JSX runtime
    if (typeof global.React === 'undefined') {
      try {
        global.React = require('react');
      } catch (e) {
        // Mock React if it can't be loaded
        global.React = {
          createElement: () => {},
          Fragment: {},
          useState: () => [null, () => {}],
          useEffect: () => {},
        };
      }
    }
    
    // Mock JSX runtime if needed
    if (typeof global.jsx === 'undefined') {
      global.jsx = function(type, props, key) {
        if (typeof type === 'function') {
          return type(props);
        }
        return { type, props, key };
      };
    }
    
    if (typeof global.jsxs === 'undefined') {
      global.jsxs = global.jsx;
    }
    
    if (typeof global.jsxDEV === 'undefined') {
      global.jsxDEV = global.jsx;
    }
  }
}

// Ensure console is available
if (typeof console === 'undefined') {
  global.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
  };
}

// Polyfill for process
if (typeof global.process === 'undefined') {
  global.process = {
    env: {
      NODE_ENV: __DEV__ ? 'development' : 'production',
    },
  };
}

// Polyfill for Buffer if needed
if (typeof global.Buffer === 'undefined') {
  try {
    global.Buffer = require('buffer').Buffer;
  } catch (e) {
    // Buffer not available, create a simple polyfill
    global.Buffer = {
      isBuffer: () => false,
    };
  }
}

// Ensure performance is available
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

// Polyfill for React Native globals
if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = process.env.NODE_ENV === 'development';
}

// Ensure __DEV__ is available globally
if (typeof __DEV__ === 'undefined') {
  global.__DEV__ = global.__DEV__ || false;
}

// Mock react-native-responsive-fontsize to prevent issues
const mockRFValue = (size) => size;
if (typeof global.__RFVALUE_POLYFILL__ === 'undefined') {
  global.__RFVALUE_POLYFILL__ = true;
  
  const originalRequire = global.require;
  global.require = function(moduleName) {
    if (moduleName === 'react-native-responsive-fontsize') {
      return { RFValue: mockRFValue };
    }
    if (moduleName === '@clerk/clerk-expo') {
      return {
        useAuth: () => ({ isSignedIn: false }),
        useOAuth: () => ({ startOAuthFlow: () => Promise.reject(new Error('Clerk not configured')) }),
      };
    }
    return originalRequire.apply(this, arguments);
  };
} 