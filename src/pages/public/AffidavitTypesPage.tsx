import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, AffidavitTypeCard} from '@/components/features';
import { useGetAffidavitTypesQuery } from '@/store/api/userApi';
import { ROUTES, TIER_CONFIG } from '@/lib/constants';
import { Search, Filter, Grid3X3, List, HelpCircle, Loader2 } from 'lucide-react';
import type { AffidavitTier } from '@/types';

export function AffidavitTypesPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<AffidavitTier | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data, isLoading, error } = useGetAffidavitTypesQuery();
  
  // Ensure affidavitTypes is always an array
  const affidavitTypes = Array.isArray(data) ? data : [];

  const filteredTypes = affidavitTypes.filter((type) => {
    const matchesSearch = type.name.toLowerCase().includes(search.toLowerCase()) ||
      type.description.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || type.tier === tierFilter;
    return matchesSearch && matchesTier && type.is_active;
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Failed to load affidavit types. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <PageHeader
        title="Affidavit Types"
        description="Browse our comprehensive collection of affidavit templates"
      >
        <Button variant="outline" asChild>
          <Link to={ROUTES.DECISION_TREE}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help Me Choose
          </Link>
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search affidavit types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tierFilter} onValueChange={(value) => setTierFilter(value as AffidavitTier | 'all')}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {Object.entries(TIER_CONFIG).map(([tier, config]) => (
              <SelectItem key={tier} value={tier}>
                Tier {tier}: {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

     
      {/* Results */}
      {filteredTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No affidavit types found matching your criteria.</p>
            <Button variant="outline" onClick={() => { setSearch(''); setTierFilter('all'); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Showing {filteredTypes.length} affidavit type{filteredTypes.length !== 1 ? 's' : ''}
          </p>
          
          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTypes.map((type) => (
                <AffidavitTypeCard key={type.id} type={type} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTypes.map((type) => (
                <AffidavitTypeCard key={type.id} type={type} variant="compact" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
