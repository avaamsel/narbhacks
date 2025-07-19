module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxRuntime: "automatic",
        },
      ],
    ],
    plugins: [
      // Add React 19 compatibility
      ["@babel/plugin-transform-runtime", {
        helpers: true,
        regenerator: true,
      }],
      // Ensure proper JSX handling for React 19
      ["@babel/plugin-transform-react-jsx", {
        runtime: "automatic",
        importSource: "react",
      }],
    ],
  };
};
