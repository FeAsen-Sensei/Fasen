# Fasen - Power Platform Components Repository

This monorepo contains multiple Power Platform components developed by Sensei Productivity.

## Repository Structure

```
├── components/                      # Individual PCF components
│   └── SenseiMultiSelectLookupField/
│       ├── MultiSelectLookupField/  # Component source code
│       ├── Solution/                # Compiled solution packages
│       ├── package.json            # Component dependencies
│       └── README.md               # Component documentation
├── shared/                         # Shared utilities and types (future)
├── docs/                          # Documentation (future)
└── README.md                      # This file
```

## Components

### [SenseiMultiSelectLookupField](./components/SenseiMultiSelectLookupField/README.md)
**Version:** 1.2.31  
**Description:** A Power Platform Component Framework (PCF) control for multi-select lookup functionality.

**Features:**
- Multi-select lookup with N:N relationship support
- FetchXML filtering capabilities
- Fluent UI React-based interface
- Configurable target entities and relationships

## Development Guidelines

### Getting Started
1. Clone this repository
2. Navigate to the specific component folder: `cd components/[ComponentName]`
3. Follow the component-specific README for setup instructions

### Adding New Components
1. Create a new folder under `components/`
2. Follow the established structure pattern
3. Update this main README with component information

### Building and Deployment
Each component has its own build and deployment process. Refer to individual component READMEs for specific instructions.

## Releases

Component releases are managed using Git tags with the format:
- `[ComponentName]-v[Version]` (e.g., `SenseiMultiSelectLookupField-v1.2.31`)

## Contributing

1. Create feature branches from `master`
2. Follow component-specific development guidelines
3. Update version numbers appropriately
4. Create pull requests for review

## License

© 2025 Sensei Productivity. All rights reserved.