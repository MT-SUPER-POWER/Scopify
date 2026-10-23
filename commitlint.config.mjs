// Format only: feat / fix / perf subjects become changelog lines (see cliff.toml).
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Chinese subjects have no letter case.
    "subject-case": [0],
  },
};
