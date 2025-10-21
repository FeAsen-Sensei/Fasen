# SenseiMultiSelectLookupField Solution

This folder contains the latest compiled solution package for the SenseiMultiSelectLookupField PCF control.

## Contents

- `SenseiMultiSelectLookupFieldSolution.zip` - The packaged solution ready for import into Power Platform environments
- `SenseiMultiSelectLookupFieldSolution.cdsproj` - Solution project file
- `src/` - Solution source files including customizations and configuration

## Version Information

- Control Version: 1.2.31
- Target Entity: Configurable via `targetEntity` property
- Relationship: Configurable via `relationshipName` property

## Usage

1. Import the `SenseiMultiSelectLookupFieldSolution.zip` file into your Power Platform environment
2. Configure the control by setting the required properties:
   - `targetEntity`: Logical name of the target entity
   - `relationshipName`: N:N relationship schema name
   - Optional: `filterXmlManual` for custom filtering
3. Bind the control to a multiline text field for the selected names output

## Features

- Multi-select lookup functionality
- FetchXML filtering support
- Output to bound field or separate ID field
- Fluent UI React components
- WebAPI integration