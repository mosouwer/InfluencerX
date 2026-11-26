const transitions = {
 accept: ['proposed', 'awaiting_payment', 'influencer'],
 decline: ['proposed', 'declined', 'influencer'],
 submit: ['active', 'review', 'influencer'],
 resubmit: ['revision', 'review', 'influencer'],
 request_revision: ['review', 'revision', 'brand'],
 approve: ['review', 'completed', 'brand'],
 cancel: ['proposed', 'cancelled', 'brand'],
};
export function transition(row, actor, action) {
 const owner = actor.role === 'brand' ? row.brand_id : actor.role === 'influencer' ? row.creator_id : null;
 if (owner !== actor.id) throw new Error('Forbidden');
 if (action === 'dispute' && ['active','review','revision'].includes(row.status)) return 'disputed';
 const rule = transitions[action];
 if (!rule || rule[0] !== row.status || rule[2] !== actor.role) throw new Error('Invalid transition');
 return rule[1];
}
