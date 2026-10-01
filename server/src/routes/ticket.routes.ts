import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  addComment,
} from '../controllers/ticket.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createTicketSchema,
  updateTicketSchema,
  updateStatusSchema,
  addCommentSchema,
  queryTicketSchema,
} from '../validators/ticket.validator.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

const router = Router();

router.get('/', validate(queryTicketSchema), asyncHandler(getTickets));
router.get('/:id', asyncHandler(getTicketById));
router.post('/', validate(createTicketSchema), asyncHandler(createTicket));
router.put('/:id', validate(updateTicketSchema), asyncHandler(updateTicket));
router.patch('/:id/status', validate(updateStatusSchema), asyncHandler(updateTicketStatus));
router.delete('/:id', asyncHandler(deleteTicket));
router.post('/:id/comments', validate(addCommentSchema), asyncHandler(addComment));

export default router;
