import { trigger, transition, style, query, animateChild, group, animate, state } from '@angular/animations';

export const slideInAnimation = trigger('routeAnimations', [
    transition('* <=> *', [
        // Oculta la página actual mientras animas la nueva
        query(
            ':enter, :leave',
            [
                style({
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    opacity: 0,
                    transform: 'scale(0.9)',
                }),
            ],
            { optional: true }
        ),
        // Anima la salida de la página actual
        group([
            query(
                ':leave',
                [
                    animate(
                        '0.3s ease-in-out',
                        style({
                            opacity: 0,
                            transform: 'scale(0.9)',
                        })
                    ),
                ],
                { optional: true }
            ),
            // Anima la entrada de la nueva página
            query(
                ':enter',
                [
                    animate(
                        '0.3s ease-in-out',
                        style({
                            opacity: 1,
                            transform: 'scale(1)',
                        })
                    ),
                ],
                { optional: true }
            ),
        ]),
    ]),
]);

export const flyInOutAnimation = trigger('flyInOut', [
    state('in', style({ transform: 'translateX(0) scale(1)', opacity: 1 })),
    transition('void => *', [
        style({ transform: 'translateX(0) scale(0.95)', opacity: 0 }),
        animate('400ms cubic-bezier(0.68, -0.55, 0.27, 1.55)', style({ transform: 'translateX(0) scale(1)', opacity: 1 }))
    ]),
    transition('* => void', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0) scale(0.95)', opacity: 0 }))
    ]),
]);