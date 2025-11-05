# FasterBook Agent Mode Implementation

## Overview

The FasterBook Agent Mode is a specialized operational mode for A.U.R.A that transforms it into a dedicated booking agent using exclusively the FasterBook API. This mode enforces strict API-only pipeline for all food and movie booking operations.

## Key Features

### 1. Mode Toggle Switch

**Location:** Chat input area (above the message input box)

**Visual Design:**
- Toggle switch with orange accent color when active
- ShoppingBag icon that changes color based on mode state
- Clear label: "FasterBook Agent Mode"
- Status indicator showing current mode

**Behavior:**
- **OFF (Default):** General AI assistant mode - handles documents, images, general queries
- **ON (Agent Mode):** Strict FasterBook API-only mode - exclusively processes bookings

### 2. Visual Indicators

When Agent Mode is **ACTIVE**:

1. **Input Box Border:** Changes from sage to orange (2px border-orange-400)
2. **Placeholder Text:** Updates to agent-specific guidance
   - "FasterBook Agent: Order food or book movie tickets (e.g., 'I want biryani' or 'Book a movie')"
3. **Toggle Switch:** Orange background (bg-orange-600)
4. **Status Message:** Shows "Using FasterBook API exclusively for all bookings"

When Agent Mode is **INACTIVE**:
- Standard sage-colored theme
- General assistant placeholder text
- Gray toggle switch

### 3. Strict Agent Pipeline

The agent mode operates through a single, secure pipeline with the following characteristics:

#### A. Single Source of Action
- **ONLY** uses FasterBook API endpoints
- Ignores all other internal APIs and mock services
- No generic LLM responses allowed

#### B. Mandatory Menu Verification
Before processing any order, the agent:
1. Calls `/api/available` to fetch current menu
2. Verifies requested items exist in the menu
3. Refuses orders for unavailable items

#### C. Agentic Conversation Flow
The agent uses a specialized system prompt that enforces:

**Professional Behavior:**
- Never says "I am only an AI" or gives generic responses
- Acts as a real booking agent
- Maintains professional, helpful tone

**Parameter Collection:**
For incomplete requests, the agent asks for specific missing parameters:

**Food Orders Require:**
- `itemId` (from FasterBook menu)
- `quantity`
- `delivery address`

**Movie Bookings Require:**
- `movieId` (from FasterBook menu)
- `seat numbers`
- `showtime`

**Example Interaction:**
```
User: "I want biryani"
Agent: "I'd be happy to order biryani for you. I need to know:
       - How many servings would you like?
       - What's your delivery address?"

User: "2 servings to Dorm A Room 12"
Agent: [Processes order via FasterBook API]
```

### 4. Technical Implementation

#### Frontend (App.tsx)
```typescript
const [fasterbookAgentMode, setFasterbookAgentMode] = useState(false);

// Update service when toggle changes
useEffect(() => {
  geminiService.setFasterbookAgentMode(fasterbookAgentMode);
}, [fasterbookAgentMode, geminiService]);
```

#### Backend (gemini.ts)

**Dual System Prompts:**
1. `SYSTEM_PROMPT` - General AI assistant (default mode)
2. `FASTERBOOK_AGENT_PROMPT` - Booking agent (agent mode)

**Mode-Specific Processing:**
```typescript
sendMessage = async (message: string): Promise<string> => {
  if (this.fasterbookAgentMode) {
    return await this.processFasterbookAgentRequest(message);
  }
  // ... normal processing
}
```

**Agent Request Handler:**
```typescript
private async processFasterbookAgentRequest(message: string): Promise<string> {
  // 1. Fetch FasterBook menu
  const availableItems = await this.fasterBookService.getAvailableItemsCached();

  // 2. Build menu context
  let menuContext = 'AVAILABLE FASTERBOOK ITEMS:\n...';

  // 3. Analyze request with agent chat
  const agentPrompt = `${menuContext}\n\nUser request: "${message}"...`;
  const result = await this.agentChat.sendMessage(agentPrompt);

  // 4. Determine if ready to process or needs more info
  if (responseText.includes('READY_TO_PROCESS_FOOD')) {
    return 'FASTERBOOK_FOOD_REQUEST';
  } else if (responseText.includes('READY_TO_PROCESS_MOVIE')) {
    return 'FASTERBOOK_MOVIE_REQUEST';
  }

  // 5. Return request for missing information
  return responseText;
}
```

### 5. User Experience Flow

#### Activating Agent Mode
1. User clicks toggle switch
2. Visual feedback: input box border turns orange
3. Placeholder text updates to agent-specific guidance
4. Mode indicator shows "Using FasterBook API exclusively"

#### Making a Booking
1. User types request (e.g., "I want pizza")
2. Agent checks FasterBook menu for availability
3. If incomplete, agent asks for missing parameters professionally
4. User provides details
5. Agent processes via FasterBook API
6. Success: Displays order card + saves to Task Center
7. All operations logged for tracking

#### Deactivating Agent Mode
1. User clicks toggle switch
2. Visual feedback: reverts to standard sage theme
3. Placeholder text returns to general assistant mode
4. A.U.R.A resumes normal operations (documents, images, etc.)

### 6. Security & Constraints

**Strict Boundaries:**
- In agent mode, CANNOT process:
  - Document analysis
  - Image generation
  - General queries
  - Other booking services (hotels, flights, rides)

**API Validation:**
- All items verified against live FasterBook menu
- No hardcoded values or assumptions
- Real-time availability checking

**Data Persistence:**
- All successful bookings saved to Supabase tasks table
- Complete audit trail maintained
- User session tracking enabled

### 7. Benefits

1. **Clear Contract:** User knows exactly what the agent will do
2. **No Confusion:** Single-purpose mode eliminates ambiguity
3. **Reliability:** Strict API enforcement ensures consistency
4. **Professional UX:** Agent behaves like a real booking service
5. **Visual Clarity:** Orange theme clearly indicates active mode

### 8. Code Locations

**Main Files:**
- `/src/App.tsx` - Toggle UI and mode state
- `/src/services/gemini.ts` - Agent logic and pipeline
- `/src/services/fasterbook.ts` - FasterBook API integration

**Key Functions:**
- `setFasterbookAgentMode(enabled: boolean)` - Enable/disable mode
- `processFasterbookAgentRequest(message: string)` - Agent pipeline
- `getAvailableItemsCached()` - Menu fetching with cache

### 9. Future Enhancements

Potential improvements:
- Voice mode for agent interactions
- Quick action buttons (e.g., "Order Again", "View Menu")
- Order history within agent mode
- Multi-language support for booking agent
- Integration with payment systems

## Conclusion

The FasterBook Agent Mode provides a professional, focused booking experience by:
1. Establishing a clear contract via the toggle switch
2. Enforcing strict FasterBook API-only pipeline
3. Providing professional agentic conversation
4. Offering clear visual feedback
5. Maintaining data integrity and security

This implementation ensures users know exactly what to expect and receive consistent, reliable booking services through the FasterBook platform.
