# SenseiMultiSelectLookupField PCF Control

A Power Platform Component Framework (PCF) control for multi-select lookup functionality.

## Project Structure

```text
├── MultiSelectLookupField/          # PCF Control source code
│   ├── ControlManifest.Input.xml    # Control manifest definition
│   ├── index.ts                     # Main control entry point
│   ├── MultiSelectLookup.tsx        # React component implementation
│   ├── types.ts                     # TypeScript type definitions
│   ├── generated/                   # Auto-generated manifest types
│   └── strings/                     # Localization resources
├── Solution/                        # Latest compiled solution
│   ├── SenseiMultiSelectLookupFieldSolution.zip  # Ready-to-import solution package
│   ├── SenseiMultiSelectLookupFieldSolution.cdsproj  # Solution project file
│   ├── src/                         # Solution source files
│   └── README.md                    # Solution documentation
├── package.json                     # Node.js dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── eslint.config.mjs               # ESLint configuration
└── SenseiMultiSelectLookupField.pcfproj  # PCF project file
```

## Getting Started

### Prerequisites

- Node.js and npm
- Power Platform CLI
- .NET Framework 4.6.2+

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the control:**

   ```bash
   npm run build
   ```

3. **Start development server:**

   ```bash
   npm run start:watch
   ```

### Building Solution

1. **Build the PCF control:**

   ```bash
   npm run build
   ```

2. **Build the solution:**

   ```bash
   msbuild SenseiMultiSelectLookupField.pcfproj
   cd Solution
   msbuild SenseiMultiSelectLookupFieldSolution.cdsproj
   ```

## Control Features

- **Multi-select lookup:** Select multiple records from related entities
- **Configurable target entity:** Specify any entity via `targetEntity` property
- **N:N relationship support:** Configure via `relationshipName` property
- **FetchXML filtering:** Optional custom filtering with `filterXmlManual`
- **Dual output modes:** Output to bound field or separate ID field
- **Fluent UI integration:** Modern React-based interface

## Configuration Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `targetEntity` | Text | Yes | Logical name of the target entity |
| `relationshipName` | Text | Yes | N:N relationship schema name |
| `filterXmlManual` | Multiple | No | FetchXML filter for target records |
| `outputToField` | TwoOptions | No | Enable/disable output to bound field |
| `selectedNames` | Multiple | Yes | Bound field for selected names output |
| `selectedIds` | Multiple | No | Optional field for selected IDs |

## Version

**Current Version:** 1.2.31

## License

© 2025 Sensei Productivity. All rights reserved.