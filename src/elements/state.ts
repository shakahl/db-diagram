import { Base } from "@db-diagram/elements/base";
import { Pointer } from "@db-diagram/elements/pointer";
import { GlobalAttribute } from "@db-diagram/elements/utils/attributes";

/**
 * Type alias for callback selection event listener.
 */
export type SelectionListener<G extends Base<SVGElement, GlobalAttribute>> = (this: G, selected: boolean) => void;

/**
 * State class represent element that can hold different state and
 * render different appearance based on each state.
 */
export abstract class State<T extends SVGGraphicsElement, A extends GlobalAttribute> extends Pointer<T, A> {

   private allowDrag: boolean;
   private allowSelect: boolean;
   private selected: boolean;

   private selectionListeners?: Array<SelectionListener<this>>;

   constructor(element: T, attr?: A) {
      super(element, attr);

      this.allowDrag = false;
      this.allowSelect = false;
      this.selected = false;
   }

   /**
    * Return true if element is draggable otherwise false is returned.
    */
   public isDraggable(): boolean {
      return this.allowDrag;
   }

   /**
    * Return true if element is selectable otherwise false is returned.
    */
   public isSelectable(): boolean {
      return this.allowSelect;
   }

   /**
    * Return true if element has been selected otherwise false is returned.
    */
   public isSelected(): boolean {
      return this.selected;
   }

   /**
    * Enable or disable drag event on the element.
    * @param enable boolean value
    */
   public draggable(enable: boolean): this {
      if (this.allowDrag !== enable) {
         this.allowDrag = enable;
         this.dragEvent(this.allowDrag);
      }
      return this;
   }

   /**
    * Enable or disable selection on the element.
    * @param enable boolean value
    */
   public selectable(enable: boolean): this {
      if (this.allowSelect !== enable) {
         this.allowSelect = enable;
         this.clickEvent(this.allowSelect);
         // reset selection state if any
         if (!this.allowSelect && this.selected) {
            this.select(false);
         }
      }
      return this;
   }

   /**
    * Set selection on the element.
    * @param selected boolean value.
    */
   public select(selected: boolean): this {
      if (this.allowSelect && this.selected !== selected) {
         this.selected = selected;
         if (this.selected) {
            this.native.classList.add("selected");
         } else {
            this.native.classList.remove("selected");
         }
         if (this.selectionListeners) {
            this.selectionListeners.forEach(async (it) => {
               it.call(this, this.selected);
            });
         }
         this.onSelectionChange();
      }
      return this;
   }

   /**
    * Add selection listener to the element.
    * @param listener selection listener
    */
   public addSelectionListener(listener: SelectionListener<this>): this {
      if (!this.selectionListeners) {
         this.selectionListeners = [listener];
      } else {
         this.selectionListeners.push(listener);
      }
      return this;
   }

   /**
    * Remove selection listener from the element.
    * @param listener a registered selection listener.
    */
   public removeSelectionListener(listener: SelectionListener<this>): this {
      let index: number;
      // tslint:disable-next-line: no-conditional-assignment
      if (this.selectionListeners && (index = this.selectionListeners.indexOf(listener)) !== -1) {
         this.selectionListeners.splice(index, 1);
      }
      return this;
   }

   /**
    * Call when element is clicked
    */
   protected onClick() {
      this.select(true);
   }

   /**
    * Call when the selection changed.
    */
   protected onSelectionChange(): void { return; }

}
