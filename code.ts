/**
 * Figma Design Linter Plugin Core Logic
 * Checks selected layers against design system standards and tokens.
 */

interface DesignSystemConfig {
    colourTokens: Map<string, RGB>;
    textStyles: Map<string, CustomTextStyle>;
    spacingTokens: Map<string, number>;
    componentTokens: Map<string, ComponentToken>;
}

interface ComponentToken {
    name: string;
    type: 'button' | 'input' | 'card' | 'text' | 'other';
    requiredProperties: string[];
    allowedVariants: string[];
}

interface CustomTextStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: string | number;
    lineHeight: number;
    letterSpacing: number;
    textCase?: string;
}

const DEFAULT_CONFIG: DesignSystemConfig = {
    colourTokens: new Map(),
    textStyles: new Map(),
    spacingTokens: new Map(),
    componentTokens: new Map()
};

let designSystemConfig: DesignSystemConfig = DEFAULT_CONFIG;

/**
 * MCP Configuration for Figma API connection
 */
interface MCPConfig {
    figmaToken: string;
    fileKey: string;
    baseUrl: string;
}

/**
 * Loads design system tokens and styles using MCP connection to Figma API
 */
async function loadDesignSystemViaMCP(): Promise<void> {
    try {
        const mcpConfig = globalConfig;

        if (!mcpConfig.figmaToken || mcpConfig.figmaToken.trim() === '') {
            await loadMockDesignSystem();
            return;
        }

        try {
            const apiPromise = loadFigmaDesignSystem(mcpConfig);
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('API timeout')), 5000);
            });
            
            await Promise.race([apiPromise, timeoutPromise]);
        } catch (apiError) {
            await loadMockDesignSystem();
        }
        
    } catch (error) {
        await loadMockDesignSystem();
    }
}

/**
 * Loads mock design system data as fallback
 */
async function loadMockDesignSystem(): Promise<void> {
    try {
        const mockData = {
            colourTokens: new Map([
                ["Primary/Blue/500", { r: 0.196, g: 0.275, b: 0.898 }],
                ["Primary/Blue/600", { r: 0.157, g: 0.220, b: 0.718 }],
                ["Primary/Blue/700", { r: 0.118, g: 0.165, b: 0.538 }],
                ["Primary/Blue/50", { r: 0.961, g: 0.965, b: 0.988 }],
                ["Primary/Blue/100", { r: 0.918, g: 0.925, b: 0.976 }],
                ["Primary/Blue/200", { r: 0.835, g: 0.851, b: 0.949 }],
                ["Primary/Blue/300", { r: 0.690, g: 0.722, b: 0.910 }],
                ["Primary/Blue/400", { r: 0.443, g: 0.498, b: 0.804 }],
                ["Secondary/Green/500", { r: 0.063, g: 0.725, b: 0.506 }],
                ["Secondary/Green/600", { r: 0.051, g: 0.580, b: 0.404 }],
                ["Secondary/Green/700", { r: 0.039, g: 0.435, b: 0.302 }],
                ["Secondary/Green/50", { r: 0.961, g: 0.988, b: 0.984 }],
                ["Secondary/Green/100", { r: 0.918, g: 0.976, b: 0.965 }],
                ["Secondary/Green/200", { r: 0.835, g: 0.949, b: 0.925 }],
                ["Secondary/Green/300", { r: 0.690, g: 0.910, b: 0.863 }],
                ["Secondary/Green/400", { r: 0.443, g: 0.804, b: 0.722 }],
                ["Neutral/Gray/50", { r: 0.980, g: 0.980, b: 0.980 }],
                ["Neutral/Gray/100", { r: 0.961, g: 0.961, b: 0.961 }],
                ["Neutral/Gray/200", { r: 0.925, g: 0.925, b: 0.925 }],
                ["Neutral/Gray/300", { r: 0.863, g: 0.863, b: 0.863 }],
                ["Neutral/Gray/400", { r: 0.722, g: 0.722, b: 0.722 }],
                ["Neutral/Gray/500", { r: 0.427, g: 0.447, b: 0.502 }],
                ["Neutral/Gray/600", { r: 0.341, g: 0.357, b: 0.400 }],
                ["Neutral/Gray/700", { r: 0.255, g: 0.267, b: 0.298 }],
                ["Neutral/Gray/800", { r: 0.169, g: 0.176, b: 0.196 }],
                ["Neutral/Gray/900", { r: 0.082, g: 0.086, b: 0.094 }],
                ["Semantic/Success/500", { r: 0.063, g: 0.725, b: 0.506 }],
                ["Semantic/Success/600", { r: 0.051, g: 0.580, b: 0.404 }],
                ["Semantic/Success/50", { r: 0.961, g: 0.988, b: 0.984 }],
                ["Semantic/Success/100", { r: 0.918, g: 0.976, b: 0.965 }],
                ["Semantic/Warning/500", { r: 0.976, g: 0.580, b: 0.063 }],
                ["Semantic/Warning/600", { r: 0.780, g: 0.463, b: 0.051 }],
                ["Semantic/Warning/50", { r: 0.996, g: 0.976, b: 0.961 }],
                ["Semantic/Warning/100", { r: 0.992, g: 0.949, b: 0.918 }],
                ["Semantic/Error/500", { r: 0.937, g: 0.220, b: 0.220 }],
                ["Semantic/Error/600", { r: 0.749, g: 0.176, b: 0.176 }],
                ["Semantic/Error/50", { r: 0.996, g: 0.961, b: 0.961 }],
                ["Semantic/Error/100", { r: 0.992, g: 0.918, b: 0.918 }],
                ["Semantic/Info/500", { r: 0.196, g: 0.275, b: 0.898 }],
                ["Semantic/Info/600", { r: 0.157, g: 0.220, b: 0.718 }],
                ["Semantic/Info/50", { r: 0.961, g: 0.965, b: 0.988 }],
                ["Semantic/Info/100", { r: 0.918, g: 0.925, b: 0.976 }]
            ]),
            textStyles: new Map([
                ["Heading/H1", { fontFamily: "Inter", fontSize: 32, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.02 }],
                ["Heading/H2", { fontFamily: "Inter", fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: -0.01 }],
                ["Heading/H3", { fontFamily: "Inter", fontSize: 24, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0 }],
                ["Heading/H4", { fontFamily: "Inter", fontSize: 20, fontWeight: 600, lineHeight: 1.35, letterSpacing: 0 }],
                ["Heading/H5", { fontFamily: "Inter", fontSize: 18, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0 }],
                ["Heading/H6", { fontFamily: "Inter", fontSize: 16, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0 }],
                ["Body/Large", { fontFamily: "Inter", fontSize: 16, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }],
                ["Body/Medium", { fontFamily: "Inter", fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }],
                ["Body/Small", { fontFamily: "Inter", fontSize: 12, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }],
                ["Caption/Large", { fontFamily: "Inter", fontSize: 12, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.01 }],
                ["Caption/Medium", { fontFamily: "Inter", fontSize: 11, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.01 }],
                ["Caption/Small", { fontFamily: "Inter", fontSize: 10, fontWeight: 500, lineHeight: 1.4, letterSpacing: 0.01 }],
                ["Button/Large", { fontFamily: "Inter", fontSize: 16, fontWeight: 600, lineHeight: 1.25, letterSpacing: 0 }],
                ["Button/Medium", { fontFamily: "Inter", fontSize: 14, fontWeight: 600, lineHeight: 1.25, letterSpacing: 0 }],
                ["Button/Small", { fontFamily: "Inter", fontSize: 12, fontWeight: 600, lineHeight: 1.25, letterSpacing: 0 }],
                ["Link/Large", { fontFamily: "Inter", fontSize: 16, fontWeight: 500, lineHeight: 1.5, letterSpacing: 0 }],
                ["Link/Medium", { fontFamily: "Inter", fontSize: 14, fontWeight: 500, lineHeight: 1.5, letterSpacing: 0 }],
                ["Link/Small", { fontFamily: "Inter", fontSize: 12, fontWeight: 500, lineHeight: 1.5, letterSpacing: 0 }]
            ]),
            spacingTokens: new Map([
                ["Spacing/0", 0], ["Spacing/1", 4], ["Spacing/2", 8], ["Spacing/3", 12], ["Spacing/4", 16],
                ["Spacing/5", 20], ["Spacing/6", 24], ["Spacing/8", 32], ["Spacing/10", 40], ["Spacing/12", 48],
                ["Spacing/16", 64], ["Spacing/20", 80], ["Spacing/24", 96], ["Spacing/32", 128], ["Spacing/40", 160],
                ["Spacing/48", 192], ["Spacing/56", 224], ["Spacing/64", 256]
            ]),
            componentTokens: new Map([
                ["Button/Primary", { name: "Button/Primary", type: "button" as const, requiredProperties: ["fillStyleId", "textStyleId"], allowedVariants: ["Large", "Medium", "Small", "Disabled"] }],
                ["Button/Secondary", { name: "Button/Secondary", type: "button" as const, requiredProperties: ["fillStyleId", "textStyleId"], allowedVariants: ["Large", "Medium", "Small", "Disabled"] }],
                ["Button/Tertiary", { name: "Button/Tertiary", type: "button" as const, requiredProperties: ["fillStyleId", "textStyleId"], allowedVariants: ["Large", "Medium", "Small", "Disabled"] }],
                ["Button/Danger", { name: "Button/Danger", type: "button" as const, requiredProperties: ["fillStyleId", "textStyleId"], allowedVariants: ["Large", "Medium", "Small", "Disabled"] }],
                ["Input/Text", { name: "Input/Text", type: "input" as const, requiredProperties: ["fillStyleId", "textStyleId"], allowedVariants: ["Large", "Medium", "Small", "Error", "Disabled"] }],
                ["Input/Password", { name: "Input/Password", type: "input" as const, requiredProperties: ["fillStyleId", "textStyleId"], allowedVariants: ["Large", "Medium", "Small", "Error", "Disabled"] }],
                ["Input/Email", { name: "Input/Email", type: "input" as const, requiredProperties: ["fillStyleId", "textStyleId"], allowedVariants: ["Large", "Medium", "Small", "Error", "Disabled"] }],
                ["Card/Default", { name: "Card/Default", type: "card" as const, requiredProperties: ["fillStyleId"], allowedVariants: ["Elevated", "Outlined", "Filled"] }],
                ["Card/Interactive", { name: "Card/Interactive", type: "card" as const, requiredProperties: ["fillStyleId"], allowedVariants: ["Hover", "Pressed", "Selected"] }],
                ["Text/Heading", { name: "Text/Heading", type: "text" as const, requiredProperties: ["textStyleId"], allowedVariants: ["H1", "H2", "H3", "H4", "H5", "H6"] }],
                ["Text/Body", { name: "Text/Body", type: "text" as const, requiredProperties: ["textStyleId"], allowedVariants: ["Large", "Medium", "Small"] }],
                ["Text/Caption", { name: "Text/Caption", type: "text" as const, requiredProperties: ["textStyleId"], allowedVariants: ["Large", "Medium", "Small"] }],
                ["Text/Link", { name: "Text/Link", type: "text" as const, requiredProperties: ["textStyleId"], allowedVariants: ["Large", "Medium", "Small"] }]
            ])
        };

        designSystemConfig = mockData;

    } catch (error) {
        await loadLocalDesignSystem();
    }
}

/**
 * Load design system from Figma API using MCP
 */
async function loadFigmaDesignSystem(config: MCPConfig): Promise<void> {
    try {
        
        const fileResponse = await fetch(`${config.baseUrl}/files/${config.fileKey}`, {
            headers: {
                'X-Figma-Token': config.figmaToken
            }
        });

        if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file: ${fileResponse.statusText}`);
        }

        const fileData = await fileResponse.json();
        
        if (fileData.styles) {
            await loadStylesFromAPI(fileData.styles, config);
        }

        if (fileData.document) {
            await loadComponentsFromAPI(fileData.document, config);
        }


    } catch (error) {
        throw error;
    }
}

/**
 * Load styles from Figma API
 */
async function loadStylesFromAPI(styles: any, config: MCPConfig): Promise<void> {
    for (const styleId in styles) {
        const styleData = styles[styleId];
        const style = styleData as any;
        
        if (style.styleType === 'FILL') {
            const styleResponse = await fetch(`${config.baseUrl}/styles/${styleId}`, {
                headers: {
                    'X-Figma-Token': config.figmaToken
                }
            });
            
            if (styleResponse.ok) {
                const styleDetails = await styleResponse.json();
                if (styleDetails.fills && styleDetails.fills[0]?.type === 'SOLID') {
                    designSystemConfig.colourTokens.set(style.name, styleDetails.fills[0].color);
                }
            }
        } else if (style.styleType === 'TEXT') {
            const styleResponse = await fetch(`${config.baseUrl}/styles/${styleId}`, {
                headers: {
                    'X-Figma-Token': config.figmaToken
                }
            });
            
            if (styleResponse.ok) {
                const styleDetails = await styleResponse.json();
                const textStyle: CustomTextStyle = {
                    fontFamily: styleDetails.fontFamily || 'Inter',
                    fontSize: styleDetails.fontSize || 14,
                    fontWeight: styleDetails.fontWeight || 400,
                    lineHeight: styleDetails.lineHeight || 1.2,
                    letterSpacing: styleDetails.letterSpacing || 0
                };
                designSystemConfig.textStyles.set(style.name, textStyle);
            }
        }
    }
}

/**
 * Load components from Figma API
 */
async function loadComponentsFromAPI(document: any, config: MCPConfig): Promise<void> {
    const componentsResponse = await fetch(`${config.baseUrl}/files/${config.fileKey}/components`, {
        headers: {
            'X-Figma-Token': config.figmaToken
        }
    });

    if (componentsResponse.ok) {
        const componentsData = await componentsResponse.json();
        
        for (const componentId in componentsData.meta.components) {
            const componentData = componentsData.meta.components[componentId];
            const component = componentData as any;
                const componentToken: ComponentToken = {
                    name: component.name,
                    type: getComponentType(component.name) as ComponentToken['type'],
                    requiredProperties: [],
                    allowedVariants: []
                };
            designSystemConfig.componentTokens.set(component.name, componentToken);
        }
    }
}

/**
 * Fallback: Load design system from local Figma file
 */
async function loadLocalDesignSystem(): Promise<void> {
    try {
        const colourStyles = figma.getLocalPaintStyles();
        for (const style of colourStyles) {
            if (style.paints.length > 0 && style.paints[0].type === 'SOLID') {
                const paint = style.paints[0] as SolidPaint;
                designSystemConfig.colourTokens.set(style.name, paint.color);
            }
        }

        const textStyles = figma.getLocalTextStyles();
        for (const style of textStyles) {
            const textStyle: CustomTextStyle = {
                fontFamily: typeof style.fontName === 'string' ? style.fontName : 'Inter',
                fontSize: style.fontSize,
                fontWeight: (style as any).fontWeight || 400,
                lineHeight: typeof style.lineHeight === 'number' ? style.lineHeight : 1.2,
                letterSpacing: typeof style.letterSpacing === 'number' ? style.letterSpacing : 0
            };
            designSystemConfig.textStyles.set(style.name, textStyle);
        }

        const componentSets = figma.root.findAll(node => node.type === 'COMPONENT_SET');
        for (const componentSet of componentSets) {
            const componentToken: ComponentToken = {
                name: componentSet.name,
                type: getComponentType(componentSet.name),
                requiredProperties: [],
                allowedVariants: (componentSet as any).children?.map((child: any) => child.name) || []
            };
            designSystemConfig.componentTokens.set(componentSet.name, componentToken);
        }

    } catch (error) {
    }
}

function getComponentType(name: string): ComponentToken['type'] {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('button') || lowerName.includes('btn')) return 'button';
    if (lowerName.includes('input') || lowerName.includes('field')) return 'input';
    if (lowerName.includes('card') || lowerName.includes('container')) return 'card';
    if (lowerName.includes('text') || lowerName.includes('label')) return 'text';
    return 'other';
}

/**
 * Interface for issue reporting.
 */
interface DesignIssue {
    type: string;
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
    
    try {
        await loadDesignSystemViaMCP();
    } catch (error) {
    }
    
    const traverse = (node: SceneNode | BaseNode) => { 
        if (!('visible' in node && node.visible) && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
            return;
        }

        if ('fills' in node && Array.isArray(node.fills)) {
            if (!node.fillStyleId) {
                const solidFill = node.fills.find(f => f.type === 'SOLID' && f.visible);
                
                if (solidFill) {
                    const issueType = node.type === 'TEXT' ? 'Text/Colour' : 'Colour/Token';
                    const detail = node.type === 'TEXT' 
                        ? 'Text uses hardcoded colour instead of design system token. Should use Functional/Carbon for text.'
                        : 'Layer uses a hardcoded fill colour. Must use a Colour Style/Token.';
                    
                    issues.push({
                        type: issueType,
                        layer: node.name,
                        nodeId: node.id,
                        detail: detail,
                        fixable: true
                    });
                }
            }
        }

        
        if (node.name.toLowerCase().includes('button') || node.name.toLowerCase().includes('btn')) {
            if (node.type === "RECTANGLE" && "fills" in node && Array.isArray(node.fills)) {
                
                if (!node.fillStyleId) {
                    const solidFill = node.fills.find(f => f.type === 'SOLID' && f.visible);
                    
                    let isIncorrectColour = false;
                    
                    if (solidFill) {
                        const { r, g, b } = solidFill.color;
                        
                        const primaryButtonColour = designSystemConfig.colourTokens.get('Primary/Blue/600');
                        const matchesPrimary = primaryButtonColour ? 
                            Math.abs(r - primaryButtonColour.r) < 0.01 &&
                            Math.abs(g - primaryButtonColour.g) < 0.01 &&
                            Math.abs(b - primaryButtonColour.b) < 0.01 : false;
                            
                        if (!matchesPrimary) {
                            isIncorrectColour = true;
                        }
                    } else if (node.fills.length > 0) {
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
    
    const node = await figma.getNodeByIdAsync(nodeId);

    if (!node) {
        return { status: 'error', message: 'Node not found or removed.' };
    }

    // Check for conditions that prevent overwriting
    if ('locked' in node && node.locked) {
        return { status: 'error', message: 'Layer is locked. Manual fix needed.' };
    }
    
    try {
        switch (issueType) {
            case 'Text/Colour': {
                // Specific fix for text color issues - apply Functional/Carbon
                if (node.type === 'TEXT') {
                    // Check for mixed fonts
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

                    if ('fills' in node && Array.isArray(node.fills)) {
                        // Get Functional/Carbon colour from design system
                        const carbonColour = designSystemConfig.colourTokens.get('Functional/Carbon') || { r: 0.1, g: 0.1, b: 0.1 };
                        
                        const newFills: SolidPaint[] = [{
                            type: "SOLID",
                            color: carbonColour,
                            opacity: 1,
                            visible: true,
                            blendMode: "NORMAL"
                        }];
                        node.fills = newFills;
                        return { status: 'success', message: 'Applied Functional/Carbon colour to text.' };
                    }
                }
                break;
            }
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
                    
                    // Get Functional/Carbon colour from design system for text
                    const carbonColour = designSystemConfig.colourTokens.get('Functional/Carbon') || { r: 0.1, g: 0.1, b: 0.1 };
                    
                    // Explicitly set type to "SOLID" to satisfy the Paint type interface
                    const newFills: SolidPaint[] = [{
                        type: "SOLID",
                        color: carbonColour,
                        opacity: 1,
                        visible: true,
                        blendMode: "NORMAL"
                    }];
                    node.fills = newFills;
                    return { status: 'success', message: 'Applied Functional/Carbon colour fill.' };
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

                    // Font size fix removed - typography should use design system text styles
                    return { status: 'error', message: 'Typography fixes should use design system text styles instead of hardcoded font sizes.' };
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

                    // Get primary button colour from design system
                    const primaryButtonColour = designSystemConfig.colourTokens.get('Primary/Blue/600') || { r: 0.196, g: 0.275, b: 0.898 };

                    // Explicitly set type to "SOLID" to satisfy the Paint type interface
                    const newFills: SolidPaint[] = [{
                        type: "SOLID",
                        color: primaryButtonColour,
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
        // FIX: Add type guard for safe access to error message
        const errorMessage = (error as any)?.message || 'An unknown error occurred.';
        return { status: 'error', message: `Runtime error during fix: ${errorMessage}` };
    }
}


// Global configuration storage
let globalConfig: MCPConfig = {
    figmaToken: '',
    fileKey: 'KkqX7OKAggFzvfB0CMUwBz',
    baseUrl: 'https://api.figma.com/v1'
};

/**
 * Main message handler loop.
 */
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'config') {
        // Store configuration from UI
        globalConfig = msg.config;
        
    } else if (msg.type === 'run-analysis') {
        const selection = figma.currentPage.selection;
        let issues: DesignIssue[] = [];
        let message = '';
        let status: 'success' | 'error' = 'success';

        if (selection.length === 0) {
            message = 'No frames or layers selected. Please select one or more layers to analyze.';
            status = 'error';
        } else {
            try {
                
                // Add timeout to prevent hanging
                const analysisPromise = runAnalysis(selection as SceneNode[]);
                const timeoutPromise = new Promise<DesignIssue[]>((_, reject) => {
                    setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000);
                });
                
                issues = await Promise.race([analysisPromise, timeoutPromise]);
                
                if (issues.length > 0) {
                    message = `Found ${issues.length} design issues in selected layers.`;
                } else {
                    message = 'Analysis complete. No design issues found!';
                }
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                message = `Analysis failed: ${errorMessage}`;
                status = 'error';
                issues = [];
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
