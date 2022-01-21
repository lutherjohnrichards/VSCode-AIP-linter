# VSCode-AIP-linter
A linter plugin for Visual Studio Code that follows Google's AIP.

The functionality is built using the executable at: https://linter.aip.dev/

## Notes
AIP spec contains rules for a lot of different platforms/languages, so users of api-linter will want to have project specific linter config which might look like this:

```
[
  {
    "disabled_rules": [
      "all"
    ],
    "enabled_rules": [
      "0158"
    ],
    "included_paths": [
      "**/*"
    ]
  }
]
```


- The plugin requires that the `api-linter` be in the path.
  - The `api-linter` can be installed with the following command: 
  ```
  go install github.com/googleapis/api-linter/cmd/api-linter@latest
  ```
- The plugin requires that there is either a `.api-linter.json` or `.api-linter.yaml` file in the project root.
- In the case where one does want the entire project to be linted with the same rules enabled, one can disable certain rules using file comments. The usage is as follows:
 ```
  // A file comment:
  // (-- api-linter: core::0140::lower-snake=disabled --)
  //
  // The above comment will disable the rule
  // `core::0140::lower-snake` for the entire file.

  syntax = "proto3";

  package google.api.linter.examples;

  message Example {
      string badFieldName = 1;
      string anotherBadFieldName = 2;
  }
``` 

