import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { MultiSelectLookup, IMultiSelectLookupProps } from "./MultiSelectLookup";
import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { ITeamRecord } from "./types";

export class MultiSelectLookupField implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _notifyOutputChanged: () => void;
    private _reactRoot: Root | null = null;
    private _allRecords: ITeamRecord[] = [];
    private _selectedRecords: ITeamRecord[] = [];
    private _selectedNames = "";
    private _selectedIds = "";
    private _outputToField = true;
    private _targetEntity = "";
    private _relationshipName = "";
    private _relatedEntityId = "";
    private _relatedEntityName = "";
    private _isProcessing = false;

    public async init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): Promise<void> {
        // Version logging for deployment verification
        console.log("🚀 PCF v1.2.8 - Fixed dropdown relative positioning + Processing indicators + Background fix 🚀");
        
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;

        // Get current entity context
        const modeWithContext = context.mode as unknown as { 
            contextInfo?: { 
                entityId: string; 
                entityTypeName: string; 
            } 
        };
        if (modeWithContext?.contextInfo?.entityId && modeWithContext?.contextInfo?.entityTypeName) {
            this._relatedEntityId = modeWithContext.contextInfo.entityId.replace(/{|}/g, "");
            this._relatedEntityName = modeWithContext.contextInfo.entityTypeName;
        } else {
            const entityRef = ((context as unknown) as { page?: { entityReference?: { id: string; logicalName: string }; getClientUrl?: () => string } }).page?.entityReference;
            if (entityRef) {
                this._relatedEntityId = entityRef.id.replace(/{|}/g, "");
                this._relatedEntityName = entityRef.logicalName;
            } else {
                const globalXrm = (window as unknown as { Xrm?: { Page?: { data?: { entity?: { getId: () => string; getEntityName: () => string } } } } }).Xrm;
                if (globalXrm?.Page?.data?.entity) {
                    const xrmEntity = globalXrm.Page.data.entity;
                    this._relatedEntityId = xrmEntity.getId().replace(/{|}/g, "");
                    this._relatedEntityName = xrmEntity.getEntityName();
                } else {
                    this._relatedEntityId = '';
                    this._relatedEntityName = '';
                }
            }
        }

        // Get configuration
        this._targetEntity = context.parameters.targetEntity.raw || "";
        this._relationshipName = context.parameters.relationshipName.raw || "";
        this._outputToField = context.parameters.outputToField.raw !== false;
        
        // Apply known correct casing for relationships
        if (this._relationshipName.toLowerCase() === "se_changeimpact_se_team") {
            this._relationshipName = "se_ChangeImpact_se_Team";
        }

        console.log("Initialized:", {
            entity: this._relatedEntityName,
            target: this._targetEntity,
            relationship: this._relationshipName
        });

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
            await this.loadAllRecords();
            if (this._relatedEntityId && this._relatedEntityName) {
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
        } catch (error) {
            console.error("Error loading all records:", error);
            this._allRecords = [];
        }
    }

    private getIntersectionEntityName(relationshipName: string): string {
        // Use direct lowercase conversion of the relationship schema name
        return relationshipName.toLowerCase();
    }

    private async loadRelatedRecords(): Promise<void> {
        try {
            const primaryNameAttr = this.getPrimaryNameAttribute(this._targetEntity);
            const entityToQuery = this.getIntersectionEntityName(this._relationshipName);

            // Query the intersection entity to get related records
            const fetchXml = `
                <fetch>
                    <entity name="${entityToQuery}">
                        <link-entity name="${this._relatedEntityName}" from="${this._relatedEntityName}id" to="${this._relatedEntityName}id" link-type="inner">
                            <filter>
                                <condition attribute="${this._relatedEntityName}id" operator="eq" value="${this._relatedEntityId}" />
                            </filter>
                        </link-entity>
                        <link-entity name="${this._targetEntity}" from="${this._targetEntity}id" to="${this._targetEntity}id" link-type="inner">
                            <attribute name="${this._targetEntity}id" alias="related_id" />
                            <attribute name="${primaryNameAttr}" alias="related_name" />
                        </link-entity>
                    </entity>
                </fetch>
            `;

            const result = await this._context.webAPI.retrieveMultipleRecords(
                entityToQuery,
                `?fetchXml=${encodeURIComponent(fetchXml)}`
            );

            this._selectedRecords = result.entities.map((e: Record<string, unknown>) => ({
                id: (e["related_id"] as string),
                name: (e["related_name"] as string) || "Unnamed"
            }));

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
        // Determine what changed
        const currentIds = new Set(this._selectedRecords.map(r => r.id));
        const newIds = new Set(selectedRecords.map(r => r.id));

        const added = selectedRecords.filter(r => !currentIds.has(r.id));
        const removed = this._selectedRecords.filter(r => !newIds.has(r.id));

        console.log("Selection change - Added:", added.length, "Removed:", removed.length);

        // Set processing state and re-render
        this._isProcessing = true;
        this.renderControl();

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

            // Notify outputs changed
            this._notifyOutputChanged();
        } catch (error) {
            console.error("Error updating relationships:", error);
        } finally {
            // Clear processing state and re-render
            this._isProcessing = false;
            this.renderControl();
        }
    }

    private async associateRecord(targetRecordId: string): Promise<void> {
        console.log("Associating record:", targetRecordId);
        
        try {
            // Check if already associated to prevent duplicate errors
            if (this._selectedRecords.some(r => r.id === targetRecordId)) {
                console.log("Record already associated, skipping:", targetRecordId);
                return;
            }

            // Use the proper webAPI.execute with Associate request
            // This is the correct way to handle N:N relationships in PCF
            const associateRequest = {
                getMetadata: () => ({
                    boundParameter: null,
                    parameterTypes: {},
                    operationType: 2,
                    operationName: "Associate"
                }),
                relationship: this._relationshipName,
                target: {
                    entityType: this._relatedEntityName,
                    id: this._relatedEntityId
                },
                relatedEntities: [{
                    entityType: this._targetEntity,
                    id: targetRecordId
                }]
            };
            
            console.log("Executing Associate request:", associateRequest);
            
            // Execute method exists at runtime but not in type definitions
            const webAPIWithExecute = this._context.webAPI as unknown as {
                execute: (request: unknown) => Promise<unknown>;
            };
            await webAPIWithExecute.execute(associateRequest);
            console.log("Successfully associated record");
        } catch (error: unknown) {
            // Handle duplicate record error gracefully (error code 2147746359)
            const err = error as { errorCode?: number; code?: number };
            if (err?.errorCode === 2147746359 || err?.code === 2147746359) {
                console.log("Record already associated (duplicate), ignoring error");
                return;
            }
            console.error("Error associating record:", error);
            throw error;
        }
    }

    private async disassociateRecord(targetRecordId: string): Promise<void> {
        console.log("Disassociating record:", targetRecordId);
        
        try {
            // Use the proper webAPI.execute with Disassociate request
            // This is the correct way to handle N:N relationships in PCF
            const disassociateRequest = {
                getMetadata: () => ({
                    boundParameter: null,
                    parameterTypes: {},
                    operationType: 2,
                    operationName: "Disassociate"
                }),
                relationship: this._relationshipName,
                target: {
                    entityType: this._relatedEntityName,
                    id: this._relatedEntityId
                },
                relatedEntityId: targetRecordId
            };
            
            console.log("Executing Disassociate request:", disassociateRequest);
            
            // Execute method exists at runtime but not in type definitions
            const webAPIWithExecute = this._context.webAPI as unknown as {
                execute: (request: unknown) => Promise<unknown>;
            };
            await webAPIWithExecute.execute(disassociateRequest);
            console.log("Successfully disassociated record");
        } catch (error: unknown) {
            console.error("Error disassociating record:", error);
            throw error;
        }
    }

    private renderControl(): void {
        const props: IMultiSelectLookupProps = {
            allRecords: this._allRecords,
            selectedRecords: this._selectedRecords,
            onSelectionChange: this.handleSelectionChange.bind(this),
            disabled: this._context.mode.isControlDisabled,
            isProcessing: this._isProcessing,
        };

        const element = React.createElement(MultiSelectLookup, props);
        
        // Use React 18 createRoot API
        if (!this._reactRoot) {
            this._reactRoot = createRoot(this._container);
        }
        this._reactRoot.render(element);
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
        if (this._reactRoot) {
            this._reactRoot.unmount();
            this._reactRoot = null;
        }
    }
}









