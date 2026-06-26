import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  resolvePluginsRelativeTo: import.meta.dirname,
});

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "apps/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
