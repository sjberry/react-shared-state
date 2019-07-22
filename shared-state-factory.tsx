import React, { createContext, useContext } from 'react';

interface CustomNames {
  provider?: string;
  hook?: string;
}

/**
 * TODO: fix docs
 * Dynamically constructs a context provider and hook which provides
 *
 * @param hook - A custom hook which provides
 * @param customNames.hook - An optional custom name which will be applied to
 * the returned hook.
 * @param customNames.provider - An optional custom name which will be applied
 * to the returned context provider.
 */
function SharedStateFactory<Type, Props = {}>(
  hook: (props?: Props) => Type,
  customNames?: CustomNames,
): {
  SharedStateProvider: React.FC<{ initArgs?: Props }>;
  SharedStateHook: (props?: Props) => Type;
} {
  const { provider: customProviderName, hook: customHookName } =
    customNames || ({} as CustomNames);

  // Create a "dummy" ancestor context that will test for whether or not the
  // `SharedStateHook` has been executed within a component that has a
  // `SharedStateProvider` as an ancestor.
  const ancestorContext = createContext<boolean>(false);

  // Create the context that's used to share state within instantiations of the
  // dynamically created `SharedStateProvider`.
  const dataContext = createContext<Type>(Object.create(null) as Type);

  /**
   * Dynamically created context provider which provides instances of the
   * supplied controller with instantiation parameters and sets state values in
   * the internally created context.
   *
   * @param children - A reference to the descendant tree (inheritend from React
   * built-in props).
   * @param initArgs - Initial values to pass to the underlying provided `hook`.
   */
  const SharedStateProvider: React.FC<{ initArgs?: Props }> = ({
    children,
    initArgs,
  }) => {
    const data = hook(initArgs);

    return (
      <ancestorContext.Provider value={true}>
        <dataContext.Provider value={data}>{children}</dataContext.Provider>;
      </ancestorContext.Provider>
    );
  };

  /**
   * A dynamically-created hook that yields the same data type as the originally
   * supplied `hook`, but with return values shared within the closest ancestor
   * `SharedStateProvider`.
   */
  const SharedStateHook = (props?: Props): Type => {
    const isDescendant = useContext(ancestorContext);

    if (!isDescendant) {
      return hook(props);
    }

    return useContext(dataContext);
  };

  // If custom provider or hook names are specified, apply them conditionally
  // here. This will affect the React stack trace and can be helpful for
  // debugging and reporting.

  if (customProviderName) {
    Object.defineProperty(SharedStateProvider, 'name', {
      value: customProviderName,
    });
  }

  if (customHookName) {
    Object.defineProperty(SharedStateHook, 'name', {
      value: customHookName,
    });
  }

  return {
    SharedStateProvider,
    SharedStateHook,
  };
}

export { SharedStateFactory };
