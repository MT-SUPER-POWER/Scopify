// feat / fix / perf subjects become user-facing changelog lines (see cliff.toml).
const USER_FACING = new Set(["feat", "fix", "perf"]);
const HIDDEN_SCOPES = new Set(["ci", "deps", "release"]);

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "subject-chinese-for-users": ({ type, scope, subject }) => {
          if (!USER_FACING.has(type) || HIDDEN_SCOPES.has(scope ?? "")) return [true];
          return [
            /\p{Script=Han}/u.test(subject ?? ""),
            "feat/fix/perf 的 subject 会直接展示给用户，请用中文描述用户能感知的变化",
          ];
        },
      },
    },
  ],
  rules: {
    "subject-chinese-for-users": [2, "always"],
    // Chinese subjects do not have letter case; keep the rule for English types only.
    "subject-case": [0],
  },
};
