import { useState, useCallback } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Check, Plus, X } from "lucide-react";
import { cn } from "~/lib/utils";

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  address: {
    building?: string;
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country: string;
    country_code: string;
  };
  boundingbox: string[];
}

interface SearchNominatimProps {
  // A list of selected location item place IDs
  selectedLocations: number[];
  onSelectLocation: (location: NominatimResult) => void;
}

export default function SearchNominatim({
  selectedLocations = [],
  onSelectLocation = () => {},
}: SearchNominatimProps) {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<NominatimResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    const userAgent =
      "atgeo-marker/1.0 (github.com/atprotocol-community/atgeo-marker)"; // <-- SET THIS!
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=10`; // Limit results for performance

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
        },
      });

      if (!response.ok) {
        // Try to get more specific error info if possible
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch (_) {}
        throw new Error(`HTTP error! Status: ${response.status}. ${errorBody}`);
      }

      const data: NominatimResult[] = await response.json();
      setResults(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to fetch results: ${err.message}`);
      } else {
        setError("An unknown error occurred during the search.");
      }
      console.error("Nominatim search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [query]); // Recreate this function only if the query state changes

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  // Allow searching by pressing Enter in the input field
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-lg w-full mx-auto">
      <div className="flex w-full items-center space-x-2">
        <Input
          type="text"
          placeholder="Enter address or place name..."
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          aria-label="Location search input"
          className="flex-grow"
        />
        <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Search data via{" "}
        <a
          href="https://nominatim.org/"
          className="text-blue-300/70 hover:underline"
        >
          OpenStreetMap Nominatim
        </a>
      </p>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {isLoading && <p>Loading results...</p>}

      {!isLoading && results && results.length > 0 && (
        <div>
          <ul className="space-y-3">
            {results.map((result) => {
              const isActive = selectedLocations.includes(result.osm_id);
              return (
                <li
                  key={result.place_id}
                  className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0 last:pb-0 flex flex-row justify-between items-center gap-2"
                >
                  <div>
                    <p className="font-medium">
                      {result.display_name.split(",")[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Lat: {parseFloat(result.lat).toFixed(6)}, Lon:{" "}
                      {parseFloat(result.lon).toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(result.address?.house_number &&
                        `${result.address.house_number} ${result.address.road}, `) ||
                        `${result.address.road}, ` ||
                        ""}
                      {result.address?.city || result.address?.county},{" "}
                      {result.address?.state}, {result.address?.country}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className={cn(
                      "border border-border group",
                      isActive ? "bg-muted" : "bg-black hover:bg-muted/50",
                    )}
                    onClick={() => onSelectLocation(result)}
                  >
                    <div className="relative flex items-center justify-center w-6 h-6">
                      <Check
                        className={cn(
                          "w-5 h-5 text-green-400 transition-transform duration-150",
                          "group-hover:scale-0", // hide on group hover
                          !isActive && "scale-0", // hide when not active
                        )}
                      />
                      <X
                        className={cn(
                          "w-5 h-5 transition-transform duration-150",
                          "scale-0 group-hover:scale-100", // show on group hover
                          isActive
                            ? "text-destructive-foreground"
                            : "scale-100 rotate-45", // show when not active (looks like plus)
                          "absolute",
                        )}
                      />
                    </div>
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!isLoading &&
        query.trim() &&
        results &&
        results.length === 0 &&
        !error && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No results found for "{query}".
          </p>
        )}
    </div>
  );
}
