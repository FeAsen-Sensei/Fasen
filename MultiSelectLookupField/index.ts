import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { MultiSelectLookup, IMultiSelectLookupProps } from "./MultiSelectLookup";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ITeamRecord } from "./types";

export class MultiSelectLookupField implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _notifyOutputChanged: () => void;
    private _allRecords: ITeamRecord[] = [];
    private _selectedRecords: ITeamRecord[] = [];
    private _selectedNames = "";
    private _selectedIds = "";
    private _outputToField = true;
    private _targetEntity = "";
    private _relationshipName = "";
    private _relatedEntityId = "";
    private _relatedEntityName = "";

    public async init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): Promise<void> {
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;

        // Get current entity context
        const entityRef = ((context as unknown) as { page: { entityReference: { id: string; logicalName: string }; getClientUrl: () => string } }).page?.entityReference;
        if (entityRef) {
            this._relatedEntityId = entityRef.id.replace(/{|}/g, "");
            this._relatedEntityName = entityRef.logicalName;
        }

        // Get configuration
        this._targetEntity = context.parameters.targetEntity.raw || "";
        this._relationshipName = context.parameters.relationshipName.raw || "";
        this._outputToField = context.parameters.outputToField.raw !== false;

        console.log("Init - Entity:", this._relatedEntityName, "ID:", this._relatedEntityId);
        console.log("Init - Target:", this._targetEntity, "Relationship:", this._relationshipName);

        // Load initial data
        await this.loadData();
        this.renderControl();
    }

    public async updateView(context: ComponentFramework.Context<IInputs>): Promise<void> {
        this._context = context;
        await this.loadData();
        this.renderControl();
    }

    private async loadData(): Promise<void> {
        try {
            // Load all available records
            await this.loadAllRecords();

            // Load currently selected/related records
            if (this._relatedEntityId) {
                await this.loadRelatedRecords();
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    private async getFilterXml(): Promise<string | undefined> {
        const filterXmlManual = this._context.parameters.filterXmlManual.raw;
        if (filterXmlManual) {
            console.log("Using manual filter");
            return filterXmlManual ?? undefined;
        }
        return undefined;
    }

    private async loadAllRecords(): Promise<void> {
        try {
            const primaryNameAttr = this.getPrimaryNameAttribute(this._targetEntity);
            const filterXml = await this.getFilterXml();

            let fetchXml = `
                <fetch>
                    <entity name="${this._targetEntity}">
                        <attribute name="${this._targetEntity}id" />
                        <attribute name="${primaryNameAttr}" />
            `;

            if (filterXml) {
                fetchXml += filterXml;
            }

            fetchXml += `
                    </entity>
                </fetch>
            `;

            const result = await this._context.webAPI.retrieveMultipleRecords(
                this._targetEntity,
                `?fetchXml=${encodeURIComponent(fetchXml)}`
            );

            this._allRecords = result.entities.map((e: Record<string, unknown>) => ({
                id: (e[`${this._targetEntity}id`] as string),
                name: (e[primaryNameAttr] as string) || "Unnamed"
            }));

            console.log("Loaded all records:", this._allRecords.length);
        } catch (error) {
            console.error("Error loading all records:", error);
            this._allRecords = [];
        }
    }

    private async loadRelatedRecords(): Promise<void> {
        try {
            // For N:N relationships, query the target entity directly through the relationship
            const primaryNameAttr = this.getPrimaryNameAttribute(this._targetEntity);

            // Use WebAPI to get related records through the N:N relationship
            const relatedRecordsQuery = `${this._relatedEntityName}s(${this._relatedEntityId})/${this._relationshipName}?$select=${this._targetEntity}id,${primaryNameAttr}`;
            
            try {
                const result = await this._context.webAPI.retrieveMultipleRecords(
                    this._targetEntity,
                    `?$select=${this._targetEntity}id,${primaryNameAttr}&$filter=${this._relatedEntityName}s/any(r:r/${this._relatedEntityName}id eq ${this._relatedEntityId})`
                );

                this._selectedRecords = result.entities.map((e: Record<string, unknown>) => ({
                    id: (e[`${this._targetEntity}id`] as string),
                    name: (e[primaryNameAttr] as string) || "Unnamed"
                }));
            } catch (filterError) {
                console.log("OData filter approach failed, trying direct relationship query:", filterError);
                
                // Alternative approach: Use the relationship navigation directly
                try {
                    const result = await this._context.webAPI.retrieveMultipleRecords(
                        this._targetEntity,
                        relatedRecordsQuery
                    );

                    this._selectedRecords = result.entities.map((e: Record<string, unknown>) => ({
                        id: (e[`${this._targetEntity}id`] as string),
                        name: (e[primaryNameAttr] as string) || "Unnamed"
                    }));
                } catch (relationshipError) {
                    console.log("Direct relationship query failed, trying FetchXML approach:", relationshipError);
                    
                    // Fallback to FetchXML approach for N:N relationships
                    const fetchXml = `
                        <fetch>
                            <entity name="${this._targetEntity}">
                                <attribute name="${this._targetEntity}id" />
                                <attribute name="${primaryNameAttr}" />
                                <link-entity name="${this._relationshipName}" from="${this._targetEntity}id" to="${this._targetEntity}id" link-type="inner">
                                    <link-entity name="${this._relatedEntityName}" from="${this._relatedEntityName}id" to="${this._relatedEntityName}id" link-type="inner">
                                        <filter>
                                            <condition attribute="${this._relatedEntityName}id" operator="eq" value="${this._relatedEntityId}" />
                                        </filter>
                                    </link-entity>
                                </link-entity>
                            </entity>
                        </fetch>
                    `;

                    const fetchResult = await this._context.webAPI.retrieveMultipleRecords(
                        this._targetEntity,
                        `?fetchXml=${encodeURIComponent(fetchXml)}`
                    );

                    this._selectedRecords = fetchResult.entities.map((e: Record<string, unknown>) => ({
                        id: (e[`${this._targetEntity}id`] as string),
                        name: (e[primaryNameAttr] as string) || "Unnamed"
                    }));
                }
            }

            this._selectedNames = this._selectedRecords.map(r => r.name).join("; ");
            this._selectedIds = this._selectedRecords.map(r => r.id).join("; ");

            console.log("Loaded related records:", this._selectedRecords.length);
        } catch (error) {
            console.error("Error loading related records:", error);
            this._selectedRecords = [];
            this._selectedNames = "";
            this._selectedIds = "";
        }
    }

    private getPrimaryNameAttribute(entityName: string): string {
        // Common patterns for primary name attributes
        const commonNames = [
            `${entityName}name`,
            "name",
            "fullname",
            "title",
            "subject"
        ];

        // For custom entities, use pattern: se_entityname -> se_name
        if (entityName.includes("_")) {
            const prefix = entityName.split("_")[0];
            commonNames.unshift(`${prefix}_name`);
        }

        return commonNames[0];
    }

    private async handleSelectionChange(selectedRecords: ITeamRecord[]): Promise<void> {
        console.log("Selection changed:", selectedRecords.length, "records");

        // Determine what changed
        const currentIds = new Set(this._selectedRecords.map(r => r.id));
        const newIds = new Set(selectedRecords.map(r => r.id));

        const added = selectedRecords.filter(r => !currentIds.has(r.id));
        const removed = this._selectedRecords.filter(r => !newIds.has(r.id));

        console.log("Added:", added.length, "Removed:", removed.length);

        try {
            // Update relationships via WebAPI
            for (const record of added) {
                await this.associateRecord(record.id);
            }

            for (const record of removed) {
                await this.disassociateRecord(record.id);
            }

            // Update state
            this._selectedRecords = selectedRecords;
            this._selectedNames = selectedRecords.map(r => r.name).join("; ");
            this._selectedIds = selectedRecords.map(r => r.id).join("; ");

            console.log("Updated selection - Names:", this._selectedNames);
            console.log("Updated selection - IDs:", this._selectedIds);

            // Notify outputs changed
            this._notifyOutputChanged();
        } catch (error) {
            console.error("Error updating relationships:", error);
        }
    }

    private async associateRecord(targetRecordId: string): Promise<void> {
        console.log("=== ASSOCIATE RECORD START ===");
        console.log("Target Record ID:", targetRecordId);
        console.log("Related Entity Name:", this._relatedEntityName);
        console.log("Related Entity ID:", this._relatedEntityId);
        console.log("Relationship Name:", this._relationshipName);
        console.log("Target Entity:", this._targetEntity);
        
        try {
            // Method 1: Try direct WebAPI association
            const associationData = {
                "@odata.id": `${this._targetEntity}s(${targetRecordId})`
            };

            await this._context.webAPI.createRecord(
                this._relationshipName,
                associationData
            );

            console.log("Associated record via WebAPI (N:N):", targetRecordId);
        } catch (webApiError: unknown) {
            console.log("WebAPI association failed, trying OData $ref approach:", webApiError);
            
            try {
                // Method 2: Use OData $ref endpoint
                const clientUrl = ((this._context as unknown) as { page: { getClientUrl: () => string } }).page.getClientUrl();
                const relationshipUrl = `${clientUrl}/api/data/v9.2/${this._relatedEntityName}s(${this._relatedEntityId})/${this._relationshipName}/$ref`;
                
                const body = {
                    "@odata.id": `${clientUrl}/api/data/v9.2/${this._targetEntity}s(${targetRecordId})`
                };

                const request = {
                    method: "POST",
                    uri: relationshipUrl,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                };

                await (this._context.webAPI as unknown as { execute: (request: unknown) => Promise<unknown> }).execute(request);

                console.log("Associated record via OData $ref (N:N):", targetRecordId);
            } catch (odataError: unknown) {
                console.error("OData association failed, trying 1:N approach:", odataError);
                // If N:N fails, try 1:N relationship by updating lookup field
                await this.createLookupRelationship(targetRecordId);
            }
        }
    }

    private async disassociateRecord(targetRecordId: string): Promise<void> {
        try {
            // Method 1: Use OData $ref endpoint for disassociation
            const clientUrl = ((this._context as unknown) as { page: { getClientUrl: () => string } }).page.getClientUrl();
            const relationshipUrl = `${clientUrl}/api/data/v9.2/${this._relatedEntityName}s(${this._relatedEntityId})/${this._relationshipName}(${targetRecordId})/$ref`;

            const request = {
                method: "DELETE",
                uri: relationshipUrl
            };

            await (this._context.webAPI as unknown as { execute: (request: unknown) => Promise<unknown> }).execute(request);

            console.log("Disassociated record via OData $ref (N:N):", targetRecordId);
        } catch (odataError: unknown) {
            console.log("OData disassociation failed, trying WebAPI delete approach:", odataError);
            
            try {
                // Method 2: Try to find and delete the intersection record
                const intersectionQuery = `${this._relationshipName}?$filter=${this._relatedEntityName}id eq ${this._relatedEntityId} and ${this._targetEntity}id eq ${targetRecordId}`;
                
                const intersectionResult = await this._context.webAPI.retrieveMultipleRecords(
                    this._relationshipName,
                    intersectionQuery
                );

                if (intersectionResult.entities.length > 0) {
                    const intersectionId = intersectionResult.entities[0][`${this._relationshipName}id`] as string;
                    await this._context.webAPI.deleteRecord(this._relationshipName, intersectionId);
                    console.log("Disassociated record via intersection delete (N:N):", targetRecordId);
                } else {
                    console.log("No intersection record found for disassociation");
                }
            } catch (webApiError: unknown) {
                console.error("WebAPI disassociation failed, trying 1:N approach:", webApiError);
                // If N:N fails, try clearing lookup field for 1:N relationship
                await this.removeLookupRelationship(targetRecordId);
            }
        }
    }

    private async createLookupRelationship(targetRecordId: string): Promise<void> {
        try {
            // For 1:N relationships, update the lookup field on the target record
            const lookupField = `_${this._relatedEntityName}_value`;
            const updateData: Record<string, unknown> = {};
            updateData[lookupField] = this._relatedEntityId;

            await this._context.webAPI.updateRecord(
                this._targetEntity,
                targetRecordId,
                updateData
            );

            console.log("Created relationship via lookup field (1:N)");
        } catch (error: unknown) {
            console.error("Error creating lookup relationship:", error);
        }
    }

    private async removeLookupRelationship(targetRecordId: string): Promise<void> {
        try {
            // For 1:N relationships, clear the lookup field on the target record
            const lookupField = `_${this._relatedEntityName}_value`;
            const updateData: Record<string, unknown> = {};
            updateData[lookupField] = null;

            await this._context.webAPI.updateRecord(
                this._targetEntity,
                targetRecordId,
                updateData
            );

            console.log("Removed relationship via lookup field (1:N)");
        } catch (error: unknown) {
            console.error("Error removing lookup relationship:", error);
        }
    }

    private renderControl(): void {
        const props: IMultiSelectLookupProps = {
            allRecords: this._allRecords,
            selectedRecords: this._selectedRecords,
            onSelectionChange: this.handleSelectionChange.bind(this),
            disabled: this._context.mode.isControlDisabled,
        };

        const element = React.createElement(MultiSelectLookup, props);
        ReactDOM.render(element, this._container);
    }

    public getOutputs(): IOutputs {
        if (this._outputToField) {
            return {
                selectedNames: this._selectedNames,
                selectedIds: this._selectedIds
            };
        }
        return {
            selectedIds: this._selectedIds
        };
    }

    public destroy(): void {
        ReactDOM.unmountComponentAtNode(this._container);
    }
}









