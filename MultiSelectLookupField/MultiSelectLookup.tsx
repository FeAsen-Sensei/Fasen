import * as React from "react";
import { ITeamRecord } from "./types";
import {
    makeStyles,
    tokens,
    Input,
    Checkbox,
    Tag,
} from "@fluentui/react-components";
import { Search20Regular, Dismiss20Regular } from "@fluentui/react-icons";

export interface IMultiSelectLookupProps {
    allRecords: ITeamRecord[];
    selectedRecords: ITeamRecord[];
    onSelectionChange: (selected: ITeamRecord[]) => void;
    disabled?: boolean;
    isProcessing?: boolean;
}

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        width: "100%",
        fontFamily: tokens.fontFamilyBase,
    },
    selectedContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        minHeight: "32px",
        padding: "6px",
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        ":focus-within": {
            boxShadow: `0 0 0 2px ${tokens.colorBrandStroke1}`,
        },
    },
    dropdownButton: {
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: "8px 12px",
        fontFamily: tokens.fontFamilyBase,
        fontSize: tokens.fontSizeBase300,
        cursor: "pointer",
        textAlign: "left",
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
        ":focus": {
            boxShadow: `0 0 0 2px ${tokens.colorBrandStroke1}`,
            outline: "none",
        },
        ":disabled": {
            opacity: 0.6,
            cursor: "not-allowed",
        },
    },
    dropdownPanel: {
        position: "absolute",
        top: "100%",
        left: "0",
        right: "0",
        maxHeight: "320px",
        overflowY: "auto",
        backgroundColor: tokens.colorNeutralBackground1,
        border: `2px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow28,
        zIndex: 999999,
        marginTop: "2px",
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        // Ensure it appears above other elements
        isolation: "isolate",
    },
    searchContainer: {
        padding: "8px",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    listContainer: {
        maxHeight: "200px",
        overflowY: "auto",
        backgroundColor: tokens.colorNeutralBackground1,
    },
    listItem: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px 16px",
        cursor: "pointer",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
        ":focus": {
            backgroundColor: tokens.colorNeutralBackground1Pressed,
            outline: `2px solid ${tokens.colorBrandStroke1}`,
        },
        ":last-child": {
            borderBottom: "none",
        },
    },
    buttonContainer: {
        display: "flex",
        gap: "8px",
        padding: "8px",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    relativeContainer: {
        position: "relative",
        width: "100%",
        // Ensure dropdown is not clipped
        zIndex: 1000,
    },
    emptyStateText: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase200,
        fontStyle: "italic",
        padding: "4px 8px",
    },
    actionButton: {
        padding: "4px 8px",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        cursor: "pointer",
        fontSize: tokens.fontSizeBase200,
        fontFamily: tokens.fontFamilyBase,
        ":hover:not(:disabled)": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
        ":disabled": {
            opacity: 0.6,
            cursor: "not-allowed",
        },
    },
});

export const MultiSelectLookup: React.FC<IMultiSelectLookupProps> = ({
    allRecords,
    isProcessing = false,
    selectedRecords,
    onSelectionChange,
    disabled = false,
}) => {
    const styles = useStyles();
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchText, setSearchText] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const filteredRecords = React.useMemo(() => {
        if (!searchText) return allRecords;
        const lower = searchText.toLowerCase();
        return allRecords.filter(r => r.name.toLowerCase().includes(lower));
    }, [allRecords, searchText]);

    const selectedIds = React.useMemo(
        () => new Set(selectedRecords.map(r => r.id)),
        [selectedRecords]
    );

    const handleToggleRecord = React.useCallback((record: ITeamRecord) => {
        try {
            const newSelection = selectedIds.has(record.id)
                ? selectedRecords.filter(r => r.id !== record.id)
                : [...selectedRecords, record];

            onSelectionChange(newSelection);
        } catch (error) {
            console.error("Error in handleToggleRecord:", error);
        }
    }, [selectedRecords, selectedIds, onSelectionChange]);

    const handleSelectAll = React.useCallback(() => {
        onSelectionChange(filteredRecords);
    }, [filteredRecords, onSelectionChange]);

    const handleClearAll = React.useCallback(() => {
        onSelectionChange([]);
    }, [onSelectionChange]);

    const handleRemoveTag = React.useCallback((record: ITeamRecord) => {
        const newSelection = selectedRecords.filter(r => r.id !== record.id);
        onSelectionChange(newSelection);
    }, [selectedRecords, onSelectionChange]);

    return (
        <div className={styles.container}>
            <div className={styles.selectedContainer}>
                {selectedRecords.length === 0 ? (
                    <span className={styles.emptyStateText}>
                        No items selected
                    </span>
                ) : (
                    selectedRecords.map(record => (
                        <Tag
                            key={record.id}
                            dismissible
                            dismissIcon={{ onClick: () => handleRemoveTag(record) }}
                            appearance="filled"
                            style={{
                                backgroundColor: '#f5f5f5',
                                color: tokens.colorNeutralForeground1,
                                border: `1px solid ${tokens.colorNeutralStroke1}`,
                            }}
                        >
                            {record.name}
                        </Tag>
                    ))
                )}
            </div>

            <div className={styles.relativeContainer} ref={containerRef}>
                <button
                    className={styles.dropdownButton}
                    onClick={(e) => {
                        console.log("Dropdown button clicked - current state:", isOpen);
                        e.preventDefault();
                        e.stopPropagation();
                        const newState = !isOpen;
                        setIsOpen(newState);
                        console.log("Dropdown new state:", newState);
                    }}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    aria-label={`Select items. ${selectedRecords.length} items currently selected`}
                    type="button"
                >
                    Select items ({selectedRecords.length} selected)
                    <span aria-hidden="true">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                <div 
                    ref={dropdownRef}
                    className={styles.dropdownPanel}
                    role="listbox"
                    aria-label="Select items"
                >
                    <div className={styles.buttonContainer}>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSelectAll();
                            }}
                            disabled={isProcessing}
                            type="button"
                            className={styles.actionButton}
                        >
                            {isProcessing ? "Processing..." : "Select All"}
                        </button>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleClearAll();
                            }}
                            disabled={isProcessing}
                            type="button"
                            className={styles.actionButton}
                        >
                            {isProcessing ? "Processing..." : "Clear All"}
                        </button>
                    </div>

                    <div className={styles.searchContainer}>
                        <Input
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e, data) => setSearchText(data.value)}
                            contentBefore={<Search20Regular />}
                        />
                    </div>

                    <div className={styles.listContainer}>
                        {filteredRecords.length === 0 ? (
                            <div className={styles.listItem}>
                                <span className={styles.emptyStateText}>
                                    {searchText ? `No items match "${searchText}"` : "No items available"}
                                </span>
                            </div>
                        ) : (
                            filteredRecords.map(record => (
                                <div
                                    key={record.id}
                                    className={styles.listItem}
                                    role="option"
                                    aria-selected={selectedIds.has(record.id)}
                                    tabIndex={0}
                                >
                                    <Checkbox
                                        checked={selectedIds.has(record.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleToggleRecord(record);
                                        }}
                                        label={record.name}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>
                )}

            </div>
        </div>
    );
};

