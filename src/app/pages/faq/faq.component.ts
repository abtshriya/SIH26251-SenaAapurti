import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { 
  FAQ_CATEGORIES, 
  FaqCategory, 
  FaqItem, 
  getFaqCategoryById, 
  searchFaqItems 
} from '../../data/faq.data';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);

  categories: FaqCategory[] = FAQ_CATEGORIES;
  activeCategory: FaqCategory = FAQ_CATEGORIES[0];
  
  // Accordion state: map questionId -> boolean
  expandedItems: Record<string, boolean> = {};

  // Search state
  searchQuery = '';
  searchResults: { category: FaqCategory; item: FaqItem }[] = [];
  isSearching = false;

  private routeSub?: Subscription;
  private routerSub?: Subscription;
  private queryParamSub?: Subscription;

  ngOnInit(): void {
    // Determine category from route data or path
    this.routeSub = this.route.data.subscribe(data => {
      const categoryId = data['categoryId'] || this.extractCategoryFromUrl();
      this.setCategory(categoryId || 'general');
    });

    // Reactive category update on NavigationEnd for smooth transitions between /faq/* routes
    this.routerSub = this.router.events.subscribe(() => {
      const categoryId = this.extractCategoryFromUrl();
      if (categoryId && categoryId !== this.activeCategory.id) {
        this.setCategory(categoryId);
      }
    });

    // Listen for query params (e.g. ?q=predictive-analytics or ?q=rations)
    this.queryParamSub = this.route.queryParams.subscribe(params => {
      const targetQuestion = params['q'] || params['question'] || params['search'];
      if (targetQuestion) {
        setTimeout(() => {
          const el = document.getElementById(`faq-${targetQuestion}`);
          if (el) {
            this.expandAndScrollTo(targetQuestion);
          } else {
            this.searchQuery = targetQuestion;
            this.onSearchChange();
          }
        }, 150);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    this.queryParamSub?.unsubscribe();
  }

  private extractCategoryFromUrl(): string {
    const urlSegments = this.router.url.split('?')[0].split('/');
    // e.g. /faq/ai-intelligence -> ai-intelligence
    return urlSegments[urlSegments.length - 1] || 'general';
  }

  setCategory(categoryId: string): void {
    const found = getFaqCategoryById(categoryId);
    if (found) {
      this.activeCategory = found;
      this.titleService.setTitle(`${this.activeCategory.title} | FAQ & Help Center • SenaAapurti`);
      // Initialize first question open by default if not set
      if (Object.keys(this.expandedItems).length === 0 && found.items.length > 0) {
        this.expandedItems[found.items[0].id] = true;
      }
    }
  }

  toggleItem(id: string): void {
    this.expandedItems[id] = !this.expandedItems[id];
  }

  isExpanded(id: string): boolean {
    return !!this.expandedItems[id];
  }

  expandAll(): void {
    for (const item of this.activeCategory.items) {
      this.expandedItems[item.id] = true;
    }
  }

  collapseAll(): void {
    for (const item of this.activeCategory.items) {
      this.expandedItems[item.id] = false;
    }
  }

  onSearchChange(): void {
    const q = this.searchQuery.trim();
    if (!q) {
      this.isSearching = false;
      this.searchResults = [];
      return;
    }
    this.isSearching = true;
    this.searchResults = searchFaqItems(q);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isSearching = false;
    this.searchResults = [];
  }

  selectSearchResult(result: { category: FaqCategory; item: FaqItem }): void {
    const targetCat = result.category;
    const targetItem = result.item;
    
    this.clearSearch();

    if (this.activeCategory.id !== targetCat.id) {
      this.router.navigate([targetCat.route], { queryParams: { q: targetItem.id } });
    } else {
      this.expandAndScrollTo(targetItem.id);
    }
  }

  private expandAndScrollTo(questionId: string): void {
    this.expandedItems[questionId] = true;
    setTimeout(() => {
      const el = document.getElementById(`faq-${questionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-flash');
        setTimeout(() => el.classList.remove('highlight-flash'), 2000);
      }
    }, 100);
  }

  navigateToCategory(cat: FaqCategory): void {
    this.clearSearch();
    this.router.navigate([cat.route]);
  }
}
