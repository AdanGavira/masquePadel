import javax.swing.*;
import javax.swing.border.*;
import java.awt.*;

public class BlocNotas2 extends JFrame {

    public BlocNotas2() {
        // Colores del logo MASQUEPADEL (solo los que vamos a usar ahora)
        Color azulOscuro = new Color(0x00, 0x2D, 0x72);     // Azul oscuro
        Color amarilloFuerte = new Color(0xFB, 0xC0, 0x2D);     // Amarillo fuerte

        setTitle("Versión 2 (extendida)");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(500, 400);
        setLocationRelativeTo(null);

        // Fondo neutro
        JPanel panelFondo = new JPanel(new GridBagLayout());
        panelFondo.setBackground(new Color(230, 230, 230));

        // Panel central tipo tarjeta
        JPanel panelTarjeta = new JPanel(new GridBagLayout());
        panelTarjeta.setPreferredSize(new Dimension(420, 350));
        panelTarjeta.setBackground(Color.WHITE);
        panelTarjeta.setBorder(new CompoundBorder(
                new LineBorder(azulOscuro, 2), // borde azul
                new EmptyBorder(20, 20, 20, 20)
        ));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Panel para logo + texto
        JPanel panelLogo = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        panelLogo.setBackground(Color.WHITE);

        ImageIcon iconoOriginal = new ImageIcon("img/logo-masquepadel-final.png");
        Image img = iconoOriginal.getImage().getScaledInstance(90, 90, Image.SCALE_SMOOTH);
        JLabel lblImagen = new JLabel(new ImageIcon(img));

        JLabel lblTexto = new JLabel("Versión 2 (extendida)");
        lblTexto.setFont(new Font("Serif", Font.BOLD, 26));
        lblTexto.setForeground(amarilloFuerte); // solo el título en amarillo

        panelLogo.add(lblImagen);
        panelLogo.add(lblTexto);

        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        panelTarjeta.add(panelLogo, gbc);

        // Panel para los campos
        JPanel panelCampos = new JPanel(new GridBagLayout());
        panelCampos.setBackground(Color.WHITE);
        GridBagConstraints gbcCampos = new GridBagConstraints();
        gbcCampos.insets = new Insets(8, 8, 8, 8);
        gbcCampos.fill = GridBagConstraints.HORIZONTAL;

        // Usuario
        gbcCampos.gridx = 0;
        gbcCampos.gridy = 0;
        JLabel lblUsuario = new JLabel("Usuario:");
        panelCampos.add(lblUsuario, gbcCampos);

        gbcCampos.gridx = 1;
        JTextField txtUsuario = new JTextField(15);
        panelCampos.add(txtUsuario, gbcCampos);

        // Contraseña
        gbcCampos.gridx = 0;
        gbcCampos.gridy = 1;
        JLabel lblPassword = new JLabel("Contraseña:");
        panelCampos.add(lblPassword, gbcCampos);

        gbcCampos.gridx = 1;
        JPasswordField txtPassword = new JPasswordField(15);
        panelCampos.add(txtPassword, gbcCampos);

        // Idioma
        gbcCampos.gridx = 0;
        gbcCampos.gridy = 2;
        JLabel lblIdioma = new JLabel("Idioma:");
        panelCampos.add(lblIdioma, gbcCampos);

        gbcCampos.gridx = 1;
        String[] idiomas = {"Español", "Inglés", "Francés"};
        JComboBox<String> comboIdioma = new JComboBox<>(idiomas);
        panelCampos.add(comboIdioma, gbcCampos);

        gbc.gridx = 0;
        gbc.gridy = 1;
        gbc.gridwidth = 2;
        panelTarjeta.add(panelCampos, gbc);

        // Panel de opciones
        JPanel panelOpciones = new JPanel(new FlowLayout(FlowLayout.LEFT));
        panelOpciones.setBackground(Color.WHITE);

        JCheckBox chkTerminos = new JCheckBox("Aceptar términos y condiciones");
        chkTerminos.setBackground(Color.WHITE);

        JRadioButton rbRecordar = new JRadioButton("Recordar usuario");
        rbRecordar.setBackground(Color.WHITE);

        panelOpciones.add(chkTerminos);
        panelOpciones.add(rbRecordar);

        gbc.gridy = 2;
        panelTarjeta.add(panelOpciones, gbc);

        // Botón Acceder
        gbc.gridy = 3;
        JButton btnAcceder = new JButton("Acceder");
        btnAcceder.setBackground(azulOscuro); // azul del logo
        btnAcceder.setForeground(Color.WHITE);
        btnAcceder.setFocusPainted(false);
        btnAcceder.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelTarjeta.add(btnAcceder, gbc);

        panelFondo.add(panelTarjeta);
        setContentPane(panelFondo);

        setVisible(true);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(BlocNotas2::new);
    }
}


