import { Component, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, ChatMessage } from '../../services/assistant.service';

@Component({
  selector: 'app-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant.component.html',
  styleUrl: './assistant.component.css'
})
export class AssistantComponent implements AfterViewChecked {
  assistantService = inject(AssistantService);
  userInputText = '';
  private shouldScrollToBottom = false;

  @ViewChild('chatScrollContainer') private chatScrollContainer?: ElementRef<HTMLDivElement>;

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  toggleChat() {
    this.assistantService.toggleChat();
    if (this.assistantService.isOpen()) {
      this.shouldScrollToBottom = true;
    }
  }

  closeChat() {
    this.assistantService.closeChat();
  }

  onHomeClick() {
    this.assistantService.resetConversation();
    this.shouldScrollToBottom = true;
  }

  onBackClick() {
    this.assistantService.goBack();
    this.shouldScrollToBottom = true;
  }

  onQuickReplyClick(replyText: string) {
    this.assistantService.sendMessage(replyText);
    this.shouldScrollToBottom = true;
  }

  onSubmitMessage() {
    const text = this.userInputText.trim();
    if (!text) return;
    this.userInputText = '';
    this.assistantService.sendMessage(text);
    this.shouldScrollToBottom = true;
  }

  formatMessageText(rawText: string): string {
    if (!rawText) return '';
    // Escape HTML tags to prevent XSS
    let escaped = rawText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold formatting: **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Code/identifier formatting: `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="asst-code">$1</code>');

    // Markdown Links: [text](url)
    escaped = escaped.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="asst-link">$1</a>'
    );

    // Bullet points: lines starting with • or -
    escaped = escaped.replace(/^•\s+(.*)$/gm, '<li class="asst-bullet">$1</li>');
    escaped = escaped.replace(/^-\s+(.*)$/gm, '<li class="asst-bullet">$1</li>');

    // Convert newlines to breaks
    escaped = escaped.replace(/\n/g, '<br>');

    return escaped;
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop =
          this.chatScrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // scroll fallback
    }
  }
}
