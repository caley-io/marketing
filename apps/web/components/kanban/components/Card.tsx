"use client";

import { Draggable } from "@hello-pangea/dnd";

type Props = {
  data: {
    id: string;
    title: string;
  };
  index: number;
};

function Card({ data, index }: Props) {
  return (
    <Draggable draggableId={data.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          role="button"
          className="truncate rounded-md border-2 border-transparent bg-white px-3 py-2 text-sm shadow-sm hover:border-black"
        >
          {data.title}
        </div>
      )}
    </Draggable>
  );
}

export default Card;
