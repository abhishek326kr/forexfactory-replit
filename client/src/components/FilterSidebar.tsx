import { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface FilterSection {
  id: string;
  title: string;
  icon?: any;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

interface FilterSidebarProps {
  sections: FilterSection[];
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
  collapsible?: boolean;
}

export default function FilterSidebar({
  sections,
  onClearAll,
  hasActiveFilters = false,
  className,
  collapsible = true
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<string[]>(
    sections.filter(s => s.defaultOpen !== false).map(s => s.id)
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (collapsible) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-auto py-1 px-2"
                data-testid="button-clear-filters"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sections.map((section, index) => (
            <Collapsible
              key={section.id}
              open={openSections.includes(section.id)}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between px-6 py-3 rounded-none hover:bg-muted/50",
                    index !== 0 && "border-t"
                  )}
                  data-testid={`button-toggle-${section.id}`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {section.icon && <section.icon className="h-4 w-4" />}
                    {section.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      openSections.includes(section.id) && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-6 py-4 border-t">
                  {section.content}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Non-collapsible version
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          {hasActiveFilters && onClearAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-auto py-1 px-2"
              data-testid="button-clear-filters"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map(section => (
          <div key={section.id}>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              {section.icon && <section.icon className="h-4 w-4" />}
              {section.title}
            </h3>
            {section.content}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}