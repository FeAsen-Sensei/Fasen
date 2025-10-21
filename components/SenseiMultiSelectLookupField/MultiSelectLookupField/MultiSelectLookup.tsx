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
        gap: "0.5rem",
        width: "100%",
        fontFamily: tokens.fontFamilyBase,
        paddingLeft: "0.125rem",
    },
    selectedContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "0.25rem",
        minHeight: "2rem",
        padding: "0.375rem",
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusMedium,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        ":focus-within": {
            boxShadow: `0 0 0 0.125rem ${tokens.colorBrandStroke1}`,
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
        padding: "0.5rem 0.75rem",
        fontFamily: tokens.fontFamilyBase,
        fontSize: tokens.fontSizeBase300,
        cursor: "pointer",
        textAlign: "left",
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
        ":focus": {
            boxShadow: `0 0 0 0.125rem ${tokens.colorBrandStroke1}`,
            outline: "none",
        },
        ":disabled": {
            opacity: 0.6,
            cursor: "not-allowed",
        },
    },
    dropdownPanel: {
        position: "fixed",
        display: "flex",
        flexDirection: "column",
        maxHeight: "25rem",
        backgroundColor: "#ffffff",
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: "0 0.25rem 1rem rgba(0, 0, 0, 0.15)",
        zIndex: 999999,
        marginTop: "0.125rem",
        color: tokens.colorNeutralForeground1,
        fontFamily: tokens.fontFamilyBase,
        isolation: "isolate",
    },
    searchContainer: {
        padding: "0.5rem",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: "#ffffff",
    },
    listContainer: {
        overflowY: "auto",
        backgroundColor: "#ffffff",
        flex: 1,
    },
    listItem: {
        display: "flex",
        alignItems: "center",
        padding: "0.75rem 1rem",
        cursor: "pointer",
        backgroundColor: "#ffffff",
        color: tokens.colorNeutralForeground1,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        ":hover": {
            backgroundColor: "#f5f5f5",
        },
        ":focus": {
            backgroundColor: tokens.colorNeutralBackground1Pressed,
            outline: "none",
        },
        ":last-child": {
            borderBottom: "none",
        },
        "& label": {
            width: "100%",
            cursor: "pointer",
            display: "flex !important",
            alignItems: "center !important",
            gap: tokens.spacingHorizontalS,
            margin: "0 !important",
            lineHeight: "1.25rem !important",
            verticalAlign: "middle !important",
            fontSize: tokens.fontSizeBase300,
        },
        "& .fui-Checkbox": {
            display: "flex !important",
            alignItems: "center !important",
            width: "100%",
            gap: tokens.spacingHorizontalS,
            verticalAlign: "middle !important",
        },
        "& .fui-Checkbox__indicator": {
            display: "flex !important",
            alignItems: "center !important",
            justifyContent: "center !important",
            flexShrink: "0 !important",
            verticalAlign: "middle !important",
            marginTop: "0 !important",
            marginBottom: "0 !important",
            alignSelf: "center !important",
        },
        "& .fui-Checkbox__input": {
            outline: "none !important",
        },
        "& .fui-Checkbox__input:focus": {
            outline: "none !important",
        },
        "& .fui-Checkbox__input:focus-visible": {
            outline: "none !important",
        },
        "& .fui-Checkbox__label": {
            display: "flex !important",
            alignItems: "center !important",
            lineHeight: "1.25rem !important",
            verticalAlign: "middle !important",
            paddingTop: "0 !important",
            paddingBottom: "0 !important",
            fontSize: tokens.fontSizeBase300,
            alignSelf: "center !important",
        },
        "& > *": {
            width: "100%",
        },
    },
    buttonContainer: {
        display: "flex",
        gap: "0.5rem",
        padding: "0.5rem",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        backgroundColor: "#ffffff",
    },
    actionButton: {
        padding: "0.25rem 0.5rem",
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
        padding: "0.25rem 0.5rem",
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
                width: rect.width - 8
            });
        } else {
            setDropdownPosition(null);
        }
    }, [isOpen]);



    React.useEffect(() => {
        updateDropdownPosition();
        
        if (isOpen) {
            const handleScroll = () => {
                updateDropdownPosition();
            };
            
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
            
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isOpen, updateDropdownPosition]);

    // Update position when selected records change (tags added/removed)
    React.useEffect(() => {
        if (isOpen) {
            updateDropdownPosition();
        }
    }, [selectedRecords.length, isOpen, updateDropdownPosition]);

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
                                    onClick={() => handleToggleRecord(record)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleToggleRecord(record);
                                        }
                                    }}
                                >
                                    <Checkbox
                                        checked={selectedIds.has(record.id)}
                                        label={record.name}
                                        style={{
                                            gap: "0.625rem",
                                            alignItems: "center",
                                            display: "flex",
                                            pointerEvents: "none"
                                        }}
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

