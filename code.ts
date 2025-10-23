/**
 * Figma Design Linter Plugin Core Logic
 * Checks selected layers against predefined design rules.
 */

// Define constants for fixing common issues
// 1. Approved colour token for non-tokenized colours (Gray/500: #6d7280)
const GRAY_500_RGB = { r: 0.427, g: 0.447, b: 0.502 }; // 109/255, 114/255, 128/255

// 2. Approved font size for non-standard typography (14px)
const APPROVED_FONT_SIZE = 14;

// 3. Primary button colour (Simulating Indigo/600: #4f46e5)
const PRIMARY_BUTTON_COLOR_RGB = { r: 0.196, g: 0.275, b: 0.898 }; // 50/255, 70/255, 229/255 (close approx)

/**
 * Interface for issue reporting.
 */
interface DesignIssue {
    type: string; // e.g., 'Colour/Token', 'Typography', 'Button/Style'
    layer: string;
    nodeId: string;
    detail: string;
    fixable: boolean;
}

/**
 * Helper function to run all analysis rules on the selected nodes.
 * @param selectedNodes The nodes to analyze.
 * @returns A promise that resolves to an array of design issues.
 */
async function runAnalysis(selectedNodes: readonly SceneNode[]): Promise<DesignIssue[]> {
    const issues: DesignIssue[] = [];
    
    // Helper to traverse all nodes, including nested children
    // **CRITICAL FIX:** This function is now SYNCHRONOUS to avoid runtime promise errors.
    const traverse = (node: SceneNode | BaseNode) => { 
        // Skip hidden nodes or non-scene nodes
        if (!('visible' in node && node.visible) && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
            return;
        }

        // Rule 4: Colour/Token Check (Check for hardcoded colours instead of styles)
        // Applies to nodes that can have fill colours (RECTANGLE, ELLIPSE, TEXT, etc.)
        if ('fills' in node && Array.isArray(node.fills)) {
            // Check if a node uses a hardcoded fill colour instead of a style ID
            if (!node.fillStyleId) {
                const solidFill = node.fills.find(f => f.type === 'SOLID' && f.visible);
                
                // Only flag if a hardcoded fill is present.
                if (solidFill) {
                    issues.push({
                        type: 'Colour/Token',
                        layer: node.name,
                        nodeId: node.id,
                        detail: 'Layer uses a hardcoded fill colour. Must use a Colour Style/Token.',
                        fixable: true
                    });
                }
            }
        }

        // Rule 5: Typography Check (Check for non-standard font sizes)
        if (node.type === 'TEXT') {
            // FONT LOADING DISABLED FOR STABILITY
            
            // Check if fontSize is the approved standard size (14px)
            if (typeof node.fontSize === 'number' && node.fontSize !== APPROVED_FONT_SIZE) {
                issues.push({
                    type: 'Typography',
                    layer: node.name,
                    nodeId: node.id,
                    detail: `Uses non-standard font size (${node.fontSize}px). Recommended size is ${APPROVED_FONT_SIZE}px.`,
                    fixable: true
                });
            }
        }
        
        // Rule 6: Primary Button Style Check
        // Checks RECTANGLES named 'Button' or 'Btn' that don't use the primary colour style/token.
        if (node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('btn')) {
            if (node.type === "RECTANGLE" && "fills" in node && Array.isArray(node.fills)) {
                
                // Assume that if fillStyleId is present, it's tokenized (Rule 4 covers missing token)
                if (!node.fillStyleId) {
                    const solidFill = node.fills.find(f => f.type === 'SOLID' && f.visible);
                    
                    let isIncorrectColour = false;
                    
                    if (solidFill) {
                        const { r, g, b } = solidFill.color;
                        
                        // Check if it matches the hardcoded Indigo/600 primary colour (within a small tolerance)
                        const matchesPrimary = 
                            Math.abs(r - PRIMARY_BUTTON_COLOR_RGB.r) < 0.01 &&
                            Math.abs(g - PRIMARY_BUTTON_COLOR_RGB.g) < 0.01 &&
                            Math.abs(b - PRIMARY_BUTTON_COLOR_RGB.b) < 0.01;
                            
                        if (!matchesPrimary) {
                            isIncorrectColour = true;
                        }
                    } else if (node.fills.length > 0) {
                        // If it has a fill but it's not a visible solid fill, flag it.
                         isIncorrectColour = true;
                    }
                    
                    if (isIncorrectColour) {
                        issues.push({
                            type: 'Button/Style',
                            layer: node.name,
                            nodeId: node.id,
                            detail: `Button uses hardcoded colour. Must use Primary Button token (Indigo/600).`,
                            fixable: true
                        });
                    }
                } else {
                     // In a real plugin, here you would check if the style ID maps to the *correct* primary token ID
                     // For this simulation, we'll assume any token (fillStyleId present) is correct unless explicitly flagged.
                }
            }
        }


        // Recursively traverse children
        if ("children" in node) {
            for (const child of node.children) {
                traverse(child); // *** NO AWAIT ***
            }
        }
    };

    // Use a top-level try-catch block to gracefully handle any unexpected errors
    try {
        for (const node of selectedNodes) {
            traverse(node); // Synchronous call
        }
    } catch (e) {
        console.error("Top-level analysis error:", e);
        // If analysis fails entirely, log it and return any partial issues found.
    }
    
    return issues; // Returns the issues array synchronously collected.
}

/**
 * Applies the appropriate fix based on the issue type and node ID.
 * @param nodeId The ID of the node to fix.
 * @param issueType The type of issue (e.g., 'Colour/Token', 'Typography').
 * @returns A status object indicating success or failure with a message.
 */
async function applyFix(nodeId: string, issueType: string): Promise<{ status: 'success' | 'error', message: string }> {
    console.log(`Attempting to apply fix for node ${nodeId}, type ${issueType}`);
    
    const node = figma.getNodeById(nodeId);

    if (!node) {
        return { status: 'error', message: 'Node not found or removed.' };
    }

    // Check for conditions that prevent overwriting
    if ('locked' in node && node.locked) {
        return { status: 'error', message: 'Layer is locked. Manual fix needed.' };
    }
    
    try {
        switch (issueType) {
            case 'Colour/Token': {
                // Critical check for fill modification crash
                const fillableTypes: SceneNode['type'][] = ['RECTANGLE', 'ELLIPSE', 'POLYGON', 'STAR', 'VECTOR', 'TEXT', 'FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'];
                
                // FIX: Replace .includes with .indexOf for broader TS support
                if (fillableTypes.indexOf(node.type as SceneNode['type']) === -1) {
                    return { status: 'error', message: `Cannot apply fill fix to node type: ${node.type}.` };
                }

                if ('fills' in node && Array.isArray(node.fills)) {
                    
                    // NEW CRITICAL FIX: Must load font before modifying fills on a TEXT node
                    if (node.type === 'TEXT') {
                         // Check for mixed fonts (array check)
                         if (Array.isArray(node.fontName)) {
                            return { status: 'error', message: 'Text layer uses mixed fonts and cannot be auto-fixed.' };
                         }
                         
                         // Check for mixed fonts (figma.mixed check)
                         if (node.fontName === figma.mixed) {
                            return { status: 'error', message: 'Text layer uses mixed fonts (figma.mixed) and cannot be auto-fixed.' };
                         }

                         try {
                            // TypeScript now knows node.fontName is FontName here
                            await figma.loadFontAsync(node.fontName);
                         } catch (e) {
                            return { status: 'error', message: 'Failed to load font for text layer. Manual fix required.' };
                         }
                    }
                    
                     // FIX: Remove invalid node.is check
                    if (node.type === 'INSTANCE' && !node.fillStyleId) {
                         return { status: 'error', message: 'Instance property may be locked or unoverrideable.' };
                    }
                    
                    // Explicitly set type to "SOLID" to satisfy the Paint type interface
                    const newFills: SolidPaint[] = [{
                        type: "SOLID",
                        color: GRAY_500_RGB,
                        opacity: 1,
                        visible: true,
                        blendMode: "NORMAL"
                    }];
                    node.fills = newFills;
                    return { status: 'success', message: 'Applied Gray/500 colour fill.' };
                }
                break;
            }
            case 'Typography': {
                if (node.type === 'TEXT') {
                    // CRITICAL: Font must be loaded to set fontSize
                     if (Array.isArray(node.fontName)) {
                        return { status: 'error', message: 'Text layer uses mixed fonts and cannot be auto-fixed.' };
                     }
                     
                     if (node.fontName === figma.mixed) {
                        return { status: 'error', message: 'Text layer uses mixed fonts (figma.mixed) and cannot be auto-fixed.' };
                     }

                     try {
                        await figma.loadFontAsync(node.fontName);
                     } catch (e) {
                        return { status: 'error', message: 'Failed to load font for text layer. Manual fix required.' };
                     }

                    node.fontSize = APPROVED_FONT_SIZE;
                    return { status: 'success', message: `Set font size to ${APPROVED_FONT_SIZE}px.` };
                }
                break;
            }
            case 'Button/Style': {
                if ('fills' in node && Array.isArray(node.fills)) {
                     // FIX: Remove invalid node.is check
                    if (node.type === 'INSTANCE' && !node.fillStyleId) {
                         return { status: 'error', message: 'Instance property may be locked or unoverrideable.' };
                    }
                    
                    // If it's a Text node inside the "Button" shape, we need to handle font loading for it too.
                    if (node.type === 'TEXT') {
                        if (Array.isArray(node.fontName)) {
                            return { status: 'error', message: 'Text layer uses mixed fonts and cannot be auto-fixed.' };
                        }
                        
                        if (node.fontName === figma.mixed) {
                            return { status: 'error', message: 'Text layer uses mixed fonts (figma.mixed) and cannot be auto-fixed.' };
                        }

                        try {
                            await figma.loadFontAsync(node.fontName);
                        } catch (e) {
                            return { status: 'error', message: 'Failed to load font for text layer. Manual fix required.' };
                        }
                    }

                    // Explicitly set type to "SOLID" to satisfy the Paint type interface
                    const newFills: SolidPaint[] = [{
                        type: "SOLID",
                        color: PRIMARY_BUTTON_COLOR_RGB,
                        opacity: 1,
                        visible: true,
                        blendMode: "NORMAL"
                    }];
                    node.fills = newFills;
                    return { status: 'success', message: `Applied Primary Button (Indigo/600) colour fill.` };
                }
                break;
            }
            default:
                return { status: 'error', message: `Unknown issue type: ${issueType}` };
        }
        return { status: 'error', message: 'Fix logic did not apply any changes.' };

    } catch (error) {
        console.error("Error during applyFix:", error);
        // FIX: Add type guard for safe access to error message
        const errorMessage = (error as any)?.message || 'An unknown error occurred.';
        return { status: 'error', message: `Runtime error during fix: ${errorMessage}` };
    }
}


/**
 * Main message handler loop.
 */
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'run-analysis') {
        const selection = figma.currentPage.selection;
        let issues: DesignIssue[] = [];
        let message = '';
        let status: 'success' | 'error' = 'success';

        if (selection.length === 0) {
            message = 'No frames or layers selected. Please select one or more layers to analyze.';
            status = 'error';
        } else {
            // Traverse selection and its children
            issues = await runAnalysis(selection as SceneNode[]);
            
            if (issues.length > 0) {
                message = `Found ${issues.length} design issues in selected layers.`;
            } else {
                message = 'Analysis complete. No design issues found! 🎉';
            }
        }

        // Send results back to UI
        figma.ui.postMessage({ type: 'analysis-result', issues, message, status });
        
    } else if (msg.type === 'zoom-to-layer') {
        // *** CRITICAL FIX: Use async API for stability and to prevent crashes on large files ***
        const node = await figma.getNodeByIdAsync(msg.nodeId);
        
        if (node) {
             figma.viewport.scrollAndZoomIntoView([node]);
             // Notify UI zoom was successful so it can swap the button
             figma.ui.postMessage({ type: 'zoom-result', status: 'success', nodeId: msg.nodeId });
        } else {
             figma.ui.postMessage({ type: 'zoom-result', status: 'error', nodeId: msg.nodeId, message: 'Layer not found.' });
        }
        
    } else if (msg.type === 'apply-fix') {
        const { nodeId, issueType } = msg;

        const result = await applyFix(nodeId, issueType);

        // Send fix result back to UI
        figma.ui.postMessage({ type: 'fix-result', status: result.status, message: result.message, nodeId: nodeId });
    }
};

/**
 * NEW FEATURE: Listen for selection changes to reset UI buttons.
 * This sends the current selection back to the UI, allowing the UI to reset the 'Apply Fix' button
 * if the user navigates away from the zoomed-to layer.
 */
figma.on('selectionchange', () => {
    const selectionIds = figma.currentPage.selection.map(n => n.id);
    figma.ui.postMessage({ type: 'selection-changed', selectionIds: selectionIds });
});

// Set the plugin window size
figma.showUI(__html__, { width: 300, height: 450 });
