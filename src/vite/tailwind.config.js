module.exports = {
  mode: "jit",
  purge: [
    "./src/**/*.{js,ts,vue}",
    "../apps/koohii/modules/**/templates/*.php",
    //
    //"./src/**/*.{js,jsx,ts,tsx,vue}",
  ],

  theme: {
    colors: {
      shaded: {
        DEFAULT: "#e7e1d3",
      },
    },
  },

  variants: {},
  plugins: [],
};
