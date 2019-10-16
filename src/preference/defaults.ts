import { Size } from "@db-diagram/elements/utils/types";
import { Visualization } from "@db-diagram/shares/elements";

/**
 * Font weight type alias
 */
export type FontWeight = "normal" | "bold" | "bolder" | "lighter" | number | string;

/**
 * Font style type alias
 */
export type FontStyle = "normal" | "italic" | "oblique" | string;

/**
 * Font setting for SVG text element
 */
export interface FontSetting {
   fontFamily?: string;
   fontWeight?: FontWeight;
   fontSize?: string;
   fontStyle?: FontStyle;
   // see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/font-variant for detail
   fontVariant?: string;
}

/**
 * The appearance setting of key field such as primary key, foreign key and unique key.
 */
export interface KeyFieldSettign {
   iconColor?: string;
   textColor?: string;
   font?: FontSetting;
}

/**
 * The appearance setting of table field.
 */
export interface FieldSetting {
   // should field hide the icon such as primary key, foreign key or unique key.
   hideIcon?: boolean;
   // text field name font setting, it will be override by specific type of field such as primary ...etc
   fontName?: FontSetting;
   // text color of field name, it will be override by specific type of field such as primary ...etc
   nameColor?: string;
   // text field type font setting
   fontType?: FontSetting;
   // text color of field type
   typeColor?: string;
   // text and icon setting for primary key field
   primary?: KeyFieldSettign;
   // text and icon setting for foreign key field
   foriegn?: KeyFieldSettign;
   // text and icon setting for unique key field
   unique?: KeyFieldSettign;
}

/**
 * Appearance table setting
 */
export interface TableSetting {
   // minimum table size regardless of table name or table field size which is smaller
   // that minimum size.
   minimumSize: Size;

   // maximum table size when name or field is too long, the truncate function
   // will be trigger to keep table size fit to the maximum size.
   maximumSize?: Size;

   // color when table is selected
   selected?: string;

   // setting to apply for table header
   header?: {
      // true if icon should disappeared.
      hideIcon?: boolean;
      // template of table name.
      name?: string;
      // background color of table header
      background?: string;
      // color of table name
      nameColor?: string;
      // color of icon
      iconColor?: string;
      // font family to render table name
      font?: FontSetting;
   };

   field?: FieldSetting;

   // setting to apply for table fotter
   footer?: {
      // true to include footer otherwise no text display in footer.
      hideFooter?: boolean;
      // template text in footer left
      left?: string;
      // template text in footer right
      right?: string;
      // text footer color
      textColor?: string;
      // footer background color
      background?: string;
      // text footer font setting
      font?: FontSetting;
   };
}

/**
 * Return default table setting diagram.
 */
export function defaultTableSetting(visualization: Visualization): TableSetting {
   const css = visualization.readOnlyElementStyle();
   const styles = visualization.getStylesDts();
   return {
      field: {
         fontName: {
            fontFamily: css.getPropertyValue(styles.dbdgFieldTextNameFontFamily),
            fontSize: css.getPropertyValue(styles.dbdgFieldTextNameFontSize),
            fontStyle: css.getPropertyValue(styles.dbdgFieldTextNameFontStyle),
            fontWeight: css.getPropertyValue(styles.dbdgFieldTextNameFontWeight),
         },
         fontType: {
            fontFamily: css.getPropertyValue(styles.dbdgFieldTextTypeFontFamily),
            fontSize: css.getPropertyValue(styles.dbdgFieldTextTypeFontSize),
            fontStyle: css.getPropertyValue(styles.dbdgFieldTextTypeFontStyle),
            fontWeight: css.getPropertyValue(styles.dbdgFieldTextTypeFontWeight),
         },
         foriegn: {
            font: {
               fontFamily: css.getPropertyValue(styles.dbdgFieldTextForeignFontFamily),
               fontSize: css.getPropertyValue(styles.dbdgFieldTextForeignFontSize),
               fontStyle: css.getPropertyValue(styles.dbdgFieldTextForeignFontStyle),
               fontWeight: css.getPropertyValue(styles.dbdgFieldTextForeignFontWeight),
            },
            iconColor: css.getPropertyValue(styles.dbdgFieldIconForeignColor),
            textColor: css.getPropertyValue(styles.dbdgFieldTextForeignColor),
         },
         hideIcon: false,
         nameColor: css.getPropertyValue(styles.dbdgFieldTextNameColor),
         primary: {
            font: {
               fontFamily: css.getPropertyValue(styles.dbdgFieldTextPrimaryFontFamily),
               fontSize: css.getPropertyValue(styles.dbdgFieldTextPrimaryFontSize),
               fontStyle: css.getPropertyValue(styles.dbdgFieldTextPrimaryFontStyle),
               fontWeight: css.getPropertyValue(styles.dbdgFieldTextPrimaryFontWeight),
            },
            iconColor: css.getPropertyValue(styles.dbdgFieldIconPrimaryColor),
            textColor: css.getPropertyValue(styles.dbdgFieldTextPrimaryColor),
         },
         typeColor: css.getPropertyValue(styles.dbdgFieldTextTypeColor),
         unique: {
            font: {
               fontFamily: css.getPropertyValue(styles.dbdgFieldTextForeignFontFamily),
               fontSize: css.getPropertyValue(styles.dbdgFieldTextForeignFontSize),
               fontStyle: css.getPropertyValue(styles.dbdgFieldTextForeignFontStyle),
               fontWeight: css.getPropertyValue(styles.dbdgFieldTextForeignFontWeight),
            },
            iconColor: css.getPropertyValue(styles.dbdgFieldIconUniqueColor),
            textColor: css.getPropertyValue(styles.dbdgFieldTextForeignColor),
         },
      },
      footer: {
         background: css.getPropertyValue(styles.dbdgTableFooterColor),
         font: {
            fontFamily: css.getPropertyValue(styles.dbdgTableFooterTextFontFamily),
            fontSize: css.getPropertyValue(styles.dbdgTableFooterTextFontSize),
            fontStyle: css.getPropertyValue(styles.dbdgTableFooterTextFontStyle),
            fontWeight: css.getPropertyValue(styles.dbdgTableFooterTextFontWeight),
         },
         hideFooter: false,
         left: "__TXT__",
         right: "__TXT__",
         textColor: css.getPropertyValue(styles.dbdgTableFooterTextColor),
      },
      header: {
         background: css.getPropertyValue(styles.dbdgTableHeaderColor),
         font: {
            fontFamily: css.getPropertyValue(styles.dbdgTableTitleFontFamily),
            fontSize: css.getPropertyValue(styles.dbdgTableTitleFontSize),
            fontStyle: css.getPropertyValue(styles.dbdgTableTitleFontStyle),
            fontWeight: css.getPropertyValue(styles.dbdgTableTitleFontWeight),
         },
         hideIcon: false,
         iconColor: css.getPropertyValue(styles.dbdgTableIconColor),
         name: "__NAME__",
         nameColor: css.getPropertyValue(styles.dbdgTableTitleColor),
      },
      maximumSize: { width: 220, height: 680 },
      minimumSize: { width: 120, height: 80 },
      selected: css.getPropertyValue(styles.dbdgTableSelectedColor),
   };
}

/**
 * Style of line connector between 2 tables
 */
export interface ConnectorLineStyle {
   stroke?: string;
   strokeWidth?: string;
   strokeDasharray?: string;
   strokeLinejoin?: "arcs" | "bevel" | "miter" | "miter-clip" | "round" | string;
   strokeLinecap?: "butt" | "round" | "square" | string;
}

/**
 * The appearance setting of ralationship
 */
export interface RelationshipSetting {
   // color of icon represent type of relationship, e.g one or many
   typeIconColor?: string;
   // strong relationship line connector style
   strongLineStyle?: ConnectorLineStyle;
   // weak relationship line connector style
   weakLineStyle?: ConnectorLineStyle;
   // indicate whether the line connector should draw as straight line otherwise
   // a curve line is drawn. By default, curve line is used.
   useStraightLine?: boolean;
   // indicate whether the relationship diagram should show text represent type of
   // the relationship. This type only applicable to no-sql database when embedded
   // or reference data type is being used.
   showRelationType?: boolean;
}

/**
 * Return default table relationship setting
 */
export function defaultRelationshipSetting(visualization: Visualization): RelationshipSetting {
   const css = visualization.readOnlyElementStyle();
   const styles = visualization.getStylesDts();
   return {
      showRelationType: false,
      strongLineStyle: {
         stroke: css.getPropertyValue(styles.dbdgRelationLineColor),
         strokeWidth: css.getPropertyValue(styles.dbdgRelationLineWidth),
      },
      typeIconColor: css.getPropertyValue(styles.dbdgRelationConnectorColor),
      useStraightLine: false,
      weakLineStyle: {
         stroke: css.getPropertyValue(styles.dbdgRelationLineColor),
         strokeDasharray: css.getPropertyValue(styles.dbdgRelationWeakLineDashArray),
         strokeLinecap: css.getPropertyValue(styles.dbdgRelationWeakLineCap),
         strokeLinejoin: css.getPropertyValue(styles.dbdgRelationWeakLineJoin),
         strokeWidth: css.getPropertyValue(styles.dbdgRelationWeakLineWidth),
      },
   };
}

/**
 * Location describe the location of diagram's component to place
 * in the dom hide hierarchy.
 */
export enum ControlLocation {
   TOP_LEFT = 1,
   TOP_RIGHT = 2,
   BOTTOM_LEFT = 3,
   BOTTOM_RIGHT = 4,
}

/**
 * Diagram appearance and options setting
 */
export interface DiagramSetting {
   // zoom & pan setting
   minimumZoom: number;
   maximumZoom: number;
   zoomable: boolean;
   pannable: boolean;

   // diagram background color
   background?: string;

   // specify the location of control such as minimap and zoom
   controlLocation: ControlLocation;
   // true indicate diagram should show minimap
   showMinimap?: boolean;
   // true indicate diagram shoule show zoom control
   showZoom?: boolean;
}

/**
 * Return default diagram setting
 */
export function defaultDiagramSetting(visualization: Visualization): DiagramSetting {
   const css = visualization.readOnlyElementStyle();
   const styles = visualization.getStylesDts();
   return {
      background: css.getPropertyValue(styles.dbdgWorkspaceBackgroun),
      controlLocation: ControlLocation.BOTTOM_RIGHT,
      maximumZoom: 5,
      minimumZoom: 1,
      pannable: true,
      showMinimap: false,
      showZoom: false,
      zoomable: true,
   };
}
