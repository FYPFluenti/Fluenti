// font-plugin.js
// This is a custom plugin for Tailwind CSS v4
export default function fontPlugin({ addBase, addUtilities, theme }) {
  // Add the base font styles to ensure font-sans works
  addBase({
    'body': {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  });
  
  // Add utility class for font-sans
  addUtilities({
    '.font-sans': {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  });
}
