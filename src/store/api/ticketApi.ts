import { baseApi } from './baseApi';
import type { 
  Ticket, 
  CreateTicketPayload, 
  TicketMessage, 
  TicketMessagePayload,
  TicketStatusPayload,
  PaginatedResponse 
} from '@/types';

export const ticketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTickets: builder.query<PaginatedResponse<Ticket>, { page?: number; status?: string }>({
      query: (params) => ({
        url: '/tickets/',
        params,
      }),
      providesTags: ['Ticket'],
    }),
    
    getTicket: builder.query<Ticket, number>({
      query: (id) => `/tickets/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Ticket', id }],
    }),
    
    createTicket: builder.mutation<Ticket, CreateTicketPayload>({
      query: (data) => {
        const formData = new FormData();
        formData.append('subject', data.subject);
        formData.append('description', data.description);
        formData.append('category', data.category);
        formData.append('priority', data.priority);
        if (data.request) {
          formData.append('request', String(data.request));
        }
        if (data.files) {
          data.files.forEach((file) => {
            formData.append('files', file);
          });
        }
        return {
          url: '/tickets/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Ticket'],
    }),
    
    replyTicket: builder.mutation<TicketMessage, { id: number; data: TicketMessagePayload }>({
      query: ({ id, data }) => ({
        url: `/tickets/${id}/reply/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Ticket', id }],
    }),
    
    updateTicketStatus: builder.mutation<Ticket, { id: number; data: TicketStatusPayload }>({
      query: ({ id, data }) => ({
        url: `/tickets/${id}/status/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Ticket', id }],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useReplyTicketMutation,
  useUpdateTicketStatusMutation,
} = ticketApi;
