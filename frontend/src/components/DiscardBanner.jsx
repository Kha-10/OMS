import React from "react";
import { Undo2 } from "lucide-react";
import { Button } from "./ui/button";

const DiscardBanner = ({ handleDiscard, handleSave }) => {
  return (
    <>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={handleDiscard}>
          <Undo2 className="w-4 h-4 mr-2" />
          Discard
        </Button>
        <Button
          type="submit"
          onClick={handleSave}
          className="bg-sky-500 hover:bg-sky-600"
        >
          Save
        </Button>
      </div>
    </>
  );
};

export default DiscardBanner;
