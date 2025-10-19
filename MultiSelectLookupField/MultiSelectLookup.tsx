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
import { Search20Regular, Dismiss20Regular } from "@fluentui/react-icons";

export interface IMultiSelectLookupProps {
    allRecords: ITeamRecord[];
    selectedRecords: ITeamRecord[];
    onSelectionChange: (selected: ITeamRecord[]) => void;
    disabled?: boolean;
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
        position: "fixed",
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
});

export const MultiSelectLookup: React.FC<IMultiSelectLookupProps> = ({
    allRecords,
    selectedRecords,
    onSelectionChange,
    disabled = false,
}) => {
    const styles = useStyles();
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchText, setSearchText] = React.useState("");
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: number; left: number; width: number } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
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

    const handleClearAll = React.useCallback(() => {
        onSelectionChange([]);
    }, [onSelectionChange]);

    const handleRemoveTag = React.useCallback((record: ITeamRecord) => {
        const newSelection = selectedRecords.filter(r => r.id !== record.id);
        onSelectionChange(newSelection);
    }, [selectedRecords, onSelectionChange]);

    // Calculate dropdown position when opening
    const updateDropdownPosition = React.useCallback(() => {
        if (buttonRef.current && isOpen) {
            const rect = buttonRef.current.getBoundingClientRect();
            console.log("Button rect:", rect);
            setDropdownPosition({
                top: rect.bottom + 2,
                left: rect.left,
                width: rect.width
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
                        <div key={record.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Tag
                                appearance="outline"
                            >
                                {record.name}
                            </Tag>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTag(record);
                                }}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    cursor: 'pointer', 
                                    padding: '4px', 
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: tokens.colorNeutralForeground2
                                }}
                                aria-label={`Remove ${record.name}`}
                                type="button"
                            >
                                <Dismiss20Regular />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.relativeContainer} ref={containerRef}>
                <button
                    ref={buttonRef}
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

            </div>

            {isOpen && dropdownPosition && createPortal(
                <div 
                    ref={dropdownRef}
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
                            style={{
                                padding: "4px 8px",
                                backgroundColor: tokens.colorNeutralBackground1,
                                color: tokens.colorNeutralForeground1,
                                border: `1px solid ${tokens.colorNeutralStroke1}`,
                                borderRadius: tokens.borderRadiusMedium,
                                cursor: "pointer",
                                fontSize: tokens.fontSizeBase200,
                            }}
                        >
                            Select All
                        </button>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelectionChange([]);
                            }}
                            type="button"
                            style={{
                                padding: "4px 8px",
                                backgroundColor: tokens.colorNeutralBackground1,
                                color: tokens.colorNeutralForeground1,
                                border: `1px solid ${tokens.colorNeutralStroke1}`,
                                borderRadius: tokens.borderRadiusMedium,
                                cursor: "pointer",
                                fontSize: tokens.fontSizeBase200,
                            }}
                        >
                            Clear All
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleRecord(record);
                                    }}
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
                </div>,
                document.body
            )}
        </div>
    );
};

