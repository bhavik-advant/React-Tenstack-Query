import { Link, useNavigate, useParams } from 'react-router-dom';

import Modal from '../UI/Modal.jsx';
import EventForm from './EventForm.jsx';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchEvent, updateEvent, queryClient } from '../../util/http.js';
import LoadingIndicator from '../UI/LoadingIndicator.jsx';
import ErrorBlock from '../UI/ErrorBlock.jsx';
// import { queryClient } from '../../util/http.js';
export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['events', params.id],
    queryFn: ({ signal }) => fetchEvent({ id: params.id, signal })
  })

  const { mutate, isPending: updatePending, isError: updateError } = useMutation({
    mutationFn: updateEvent,
    onMutate: async (data) => {
      const newEvent = data.event;

      await queryClient.cancelQueries({ queryKey: ['events', params.id] })
      const previousEvent = queryClient.getQueryData(['events', params.id]);
      queryClient.setQueryData(['events', params.id], newEvent);
      return { previousEvent }
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(['events', params.id], context.previousEvent);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['events', params.id])
    }
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['events'] })
    //   navigate(`/events/${params.id}`);
    // }
  })

  function handleSubmit(formData) {
    mutate({ id: params.id, event: formData });
    navigate('../');
  }

  function handleClose() {
    navigate('../');
  }

  let content;

  if (isPending) {
    content = (
      <div className="center">
        <LoadingIndicator />
      </div>
    )
  }

  if (isError && updateError) {
    content = (
      <>
        <ErrorBlock title="Failed to fetch event" message={error.info?.message || 'Failed to fetch event , please check inputs and try again later'} />
        <div className="form-actions">
          <Link to="../" className='button'>
            Okay
          </Link>
        </div>
      </>
    )
  }

  if (data) {
    content = (
      <>
        {updatePending && (<><p>Updating event Details</p></>)}
        <EventForm inputData={data} onSubmit={handleSubmit}>
          {!updatePending && (
            <>
              <Link to="../" className="button-text">
                Cancel
              </Link>
              <button type="submit" className="button">
                Update
              </button>
            </>
          )}
        </EventForm>
      </>
    )
  }

  return (
    <Modal onClose={handleClose}>
      {content}
    </Modal>
  );
}
