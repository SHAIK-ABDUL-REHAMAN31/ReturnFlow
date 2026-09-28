import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../lib/api-client.js";

export const fetchReturns = createAsyncThunk(
  "returns/fetchReturns",
  async (params = {}, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set("status", params.status);
      if (params.search) searchParams.set("search", params.search);
      if (params.page) searchParams.set("page", params.page.toString());
      if (params.limit) searchParams.set("limit", params.limit.toString());

      const queryStr = searchParams.toString()
        ? `?${searchParams.toString()}`
        : "";
      return await apiFetch(`/returns${queryStr}`);
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

export const fetchReturnMetrics = createAsyncThunk(
  "returns/fetchReturnMetrics",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiFetch("/returns/metrics");
      return data.metrics;
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

export const fetchReturnById = createAsyncThunk(
  "returns/fetchReturnById",
  async (returnId, { rejectWithValue }) => {
    try {
      const data = await apiFetch(`/returns/${returnId}`);
      return data.return;
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

export const approveReturn = createAsyncThunk(
  "returns/approveReturn",
  async ({ returnId, note }, { rejectWithValue }) => {
    try {
      const data = await apiFetch(`/returns/${returnId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ note }),
      });
      return data.return;
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

export const rejectReturn = createAsyncThunk(
  "returns/rejectReturn",
  async (
    { returnId, reason, category, message, merchantPhotos },
    { rejectWithValue },
  ) => {
    try {
      const data = await apiFetch(`/returns/${returnId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ reason, category, message, merchantPhotos }),
      });
      return data.return;
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

export const markReceived = createAsyncThunk(
  "returns/markReceived",
  async ({ returnId, note }, { rejectWithValue }) => {
    try {
      const data = await apiFetch(`/returns/${returnId}/receive`, {
        method: "PATCH",
        body: JSON.stringify({ note }),
      });
      return data.return;
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

export const refundReturn = createAsyncThunk(
  "returns/refundReturn",
  async ({ returnId, refundAmount, note }, { rejectWithValue }) => {
    try {
      const data = await apiFetch(`/returns/${returnId}/refund`, {
        method: "PATCH",
        body: JSON.stringify({ refundAmount, note }),
      });
      return data.return;
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

export const createReturn = createAsyncThunk(
  "returns/createReturn",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await apiFetch("/returns", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data.return;
    } catch (err) {
      return rejectWithValue({ code: err.code, message: err.message });
    }
  },
);

const returnsSlice = createSlice({
  name: "returns",
  initialState: {
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    selectedReturn: null,
    metrics: {
      total: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      LABEL_GENERATED: 0,
      IN_TRANSIT: 0,
      RECEIVED: 0,
      REFUNDED: 0,
      REJECTED: 0,
      totalRefundedAmount: 0,
    },
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearReturnsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchReturns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturns.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchReturns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch returns";
      })
      // Metrics
      .addCase(fetchReturnMetrics.fulfilled, (state, action) => {
        state.metrics = action.payload;
      })
      // Single return
      .addCase(fetchReturnById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReturnById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedReturn = action.payload;
      })
      .addCase(fetchReturnById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load return";
      })
      // Mutations (Approve, Reject, Receive, Refund)
      .addMatcher(
        (action) =>
          [
            approveReturn.pending,
            rejectReturn.pending,
            markReceived.pending,
            refundReturn.pending,
          ].includes(action.type),
        (state) => {
          state.actionLoading = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          [
            approveReturn.fulfilled,
            rejectReturn.fulfilled,
            markReceived.fulfilled,
            refundReturn.fulfilled,
          ].includes(action.type),
        (state, action) => {
          state.actionLoading = false;
          const updatedReturn = action.payload;
          const normalizedReturn =
            updatedReturn && updatedReturn.status === "APPROVED"
              ? { ...updatedReturn, status: "LABEL_GENERATED" }
              : updatedReturn;

          state.selectedReturn = normalizedReturn;

          if (normalizedReturn?._id) {
            const index = state.items.findIndex(
              (item) => item._id === normalizedReturn._id,
            );
            if (index !== -1) {
              state.items[index] = normalizedReturn;
            } else {
              state.items = [normalizedReturn, ...state.items];
            }
          }
        },
      )
      .addMatcher(
        (action) =>
          [
            approveReturn.rejected,
            rejectReturn.rejected,
            markReceived.rejected,
            refundReturn.rejected,
          ].includes(action.type),
        (state, action) => {
          state.actionLoading = false;
          state.error = action.payload?.message || "Action failed";
        },
      );
  },
});

export const { clearReturnsError } = returnsSlice.actions;
export default returnsSlice.reducer;
