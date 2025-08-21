import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "@/helper/axios";
import useCategoriesActions from "@/hooks/useCategoriesActions";

function SortableItem({ id, name, count }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-3 px-4 py-3 bg-white cursor-move 
        ${isDragging ? "opacity-50 bg-gray-100" : ""}
      `}
    >
      <button className="touch-none p-1 text-gray-400 hover:text-gray-600">
        <GripVertical className="h-5 w-5" />
      </button>
      <span>{name}</span>
      {count !== undefined && count > 0 && (
        <span className="text-gray-500">({count})</span>
      )}
    </div>
  );
}

export function SequenceDialog({ open, onOpenChange, categories }) {
  const [items, setItems] = useState([]);
  const { updateSequenceMutation } = useCategoriesActions();

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end event
  function handleDragEnd(event) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSave = async () => {
    const updatedCategories = items.map((item) => {
      const original = categories.find(c => c._id === item._id);
      return original ? { ...item, visibility: original.visibility } : item;
    });
    updateSequenceMutation.mutate(updatedCategories);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change sequence of visible categories</DialogTitle>
          <DialogDescription>
            
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item._id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableItem
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  count={item.products?.length}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-blue-500 hover:bg-blue-600"
            onClick={handleSave}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
