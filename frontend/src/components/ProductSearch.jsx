import { useState } from "react";
import { Search, GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
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
import { cn } from "@/lib/utils";

function SortableProductItem({
  product,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-md border px-3 py-2",
        isDragging && "bg-accent opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
        <span>{product.name}</span>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          {product.visibility}
        </Badge>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(product._id)}
        className="h-8 w-8 text-gray-400 hover:text-gray-500"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Remove product</span>
      </Button>
    </div>
  );
}

export default function ProductSearch({
  selectedProducts =[],
  setSelectedProducts,
  products,
}) {
  console.log(selectedProducts);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelect = (product) => {
    if (!selectedProducts.find((p) => p._id === product._id)) {
      const newSelectedProducts = [...selectedProducts, product];
      setSelectedProducts(newSelectedProducts);
    }
    setOpen(false);
    setSearch("");
  };

  const handleRemove = (productId) => {
    const newSelectedProducts = selectedProducts.filter(
      (p) => p._id !== productId
    );
    setSelectedProducts(newSelectedProducts);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedProducts((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-4">
      <p>Add products</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search product"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input pl-8 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setOpen(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandList>
              <CommandEmpty>No products found.</CommandEmpty>
              <CommandGroup>
                {products
                  .filter(
                    (product) =>
                      !selectedProducts.find((p) => p._id === product._id) &&
                      product.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((product) => (
                    <CommandItem
                      key={product._id}
                      onSelect={() => handleSelect(product)}
                      className="flex items-center justify-between"
                    >
                      <span>{product.name}</span>
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-green-100 text-green-700"
                      >
                        {product.visibility}
                      </Badge>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={selectedProducts.map((product) => product._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 bg-white">
            {selectedProducts.map((product) => (
              <SortableProductItem
                key={product._id}
                product={product}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
