import * as React from "react";
import { createPortal } from "react-dom";
import { ITeamRecord } from "./types";
import {
    makeStyles,
    tokens,
    Input,
    Checkbox,
    Tag,
} from "@fluentui/react-components";
import { Search20Regular } from "@fluentui/react-icons";

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
        paddingLeft: "2px",
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
        position: "fixed",
        maxHeight: "320px",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
        zIndex: 999999,
        marginTop: "2px",
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        isolation: "isolate",
    },
    searchContainer: {
        padding: "8px",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: "#ffffff",
    },
    listContainer: {
        maxHeight: "200px",
        overflowY: "auto",
        backgroundColor: "#ffffff",
    },
    listItem: {
        display: "flex",
        alignItems: "center",
        gap: "18px",
        padding: "12px 16px",
        cursor: "pointer",
        backgroundColor: "#ffffff",
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
    checkboxWrapper: {
        display: "flex",
        alignItems: "center",
        width: "100%",
    },
    buttonContainer: {
        display: "flex",
        gap: "8px",
        padding: "8px",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: "#ffffff",
    },
    actionButton: {
        padding: "4px 8px",
        backgroundColor: "#ffffff",
        color: tokens.colorNeutralForeground1,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        cursor: "pointer",
        fontSize: tokens.fontSizeBase200,
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
        ":disabled": {
            opacity: 0.6,
            cursor: "not-allowed",
        },
    },
    relativeContainer: {
        position: "relative",
        width: "100%",
        zIndex: 1000,
    },
    emptyStateText: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase200,
        fontStyle: "italic",
        padding: "4px 8px",
    },
});

export const MultiSelectLookup: React.FC<IMultiSelectLookupProps> = ({
    allRecords,
    selectedRecords,
    onSelectionChange,
    disabled = false,
    isProcessing = false,
}) => {
    const styles = useStyles();
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchText, setSearchText] = React.useState("");
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

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

    const handleRemoveTag = React.useCallback((record: ITeamRecord) => {
        const newSelection = selectedRecords.filter(r => r.id !== record.id);
        onSelectionChange(newSelection);
    }, [selectedRecords, onSelectionChange]);

    const updateDropdownPosition = React.useCallback(() => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 2,
                left: rect.left,
                width: rect.width - 2
            });
        } else {
            setDropdownPosition(null);
        }
    }, [isOpen]);

    React.useEffect(() => {
        updateDropdownPosition();
    }, [isOpen, updateDropdownPosition]);

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

            <div className={styles.relativeContainer}>
                <button
                    ref={buttonRef}
                    className={styles.dropdownButton}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(!isOpen);
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
            </div>

            {isOpen && dropdownPosition && createPortal(
                <div 
                    className={styles.dropdownPanel}
                    role="listbox"
                    aria-label="Select items"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`,
                    }}
                >
                    <div className={styles.buttonContainer}>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSelectAll();
                            }}
                            type="button"
                            disabled={isProcessing}
                            className={styles.actionButton}
                        >
                            {isProcessing ? "Processing..." : "Select All"}
                        </button>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectionChange([]);
                            }}
                            type="button"
                            disabled={isProcessing}
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
                                    <div className={styles.checkboxWrapper}>
                                        <Checkbox
                                            checked={selectedIds.has(record.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleToggleRecord(record);
                                            }}
                                            label={record.name}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

