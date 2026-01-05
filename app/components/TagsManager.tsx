"use client";

import { useState, useEffect } from "react";
import { Tag as TagComponent, Button } from "@navikt/ds-react";

interface TagsManagerProps {
  company: string;
  currentTags?: string[];
  onTagsChange?: (tags: string[]) => void;
}

const AVAILABLE_TAGS = [
  "Startup",
  "Kreativt",
  "Tech",
  "Design",
  "UX",
  "Marketing",
  "Service",
  "Produksjon",
  "Medier",
  "E-handel",
];

export function TagsManager({ company, currentTags = [], onTagsChange }: TagsManagerProps) {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    // Load tags for this company
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => {
        const companyTags = data[company] || [];
        setTags(companyTags);
        if (onTagsChange) {
          onTagsChange(companyTags);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, [company, onTagsChange]);

  const addTag = async (tag: string) => {
    if (!tag.trim() || tags.includes(tag)) return;

    try {
      await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", company, tag: tag.trim() }),
      });

      const newTags = [...tags, tag.trim()];
      setTags(newTags);
      if (onTagsChange) {
        onTagsChange(newTags);
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const removeTag = async (tag: string) => {
    try {
      await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", company, tag }),
      });

      const newTags = tags.filter((t) => t !== tag);
      setTags(newTags);
      if (onTagsChange) {
        onTagsChange(newTags);
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagComponent
            key={tag}
            size="small"
            variant="neutral"
            className="cursor-pointer"
            onClick={() => removeTag(tag)}
          >
            {tag} ×
          </TagComponent>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Legg til tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(newTag);
              setNewTag("");
            }
          }}
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <Button
          size="small"
          variant="secondary"
          onClick={() => {
            addTag(newTag);
            setNewTag("");
          }}
        >
          Legg til
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-slate-500">Forslag:</span>
        {AVAILABLE_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
          <button
            key={tag}
            onClick={() => addTag(tag)}
            className="text-xs text-accent hover:underline"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

