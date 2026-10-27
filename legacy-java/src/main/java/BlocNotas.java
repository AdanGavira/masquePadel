import javax.swing.*;
import javax.swing.border.CompoundBorder;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import java.awt.*;

public class BlocNotas extends JFrame {

    public BlocNotas() {
        setTitle("Versión Clásica - Login");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(500, 350);
        setLocationRelativeTo(null);

        //Panel fondo
        JPanel panelFondo = new JPanel(new GridBagLayout());
        panelFondo.setBackground(new Color(230, 230, 230));

        // Panel principal
        JPanel panelTarjeta = new JPanel(new GridBagLayout());
        panelTarjeta.setPreferredSize(new Dimension(400, 300));
        panelTarjeta.setBackground(Color.WHITE);
        panelTarjeta.setBorder(new CompoundBorder(
                new LineBorder(new Color(150, 150, 150), 2), // borde visible
                new EmptyBorder(20, 20, 20, 20)             // padding interno
        ));

        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        // Panel horizontal para logo + texto
        JPanel panelLogo = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        panelLogo.setBackground(Color.WHITE);

        // Cargar y redimensionar la imagen del logo
        ImageIcon iconoOriginal = new ImageIcon("img/logo-masquepadel-final.png"); // ruta de tu imagen
        Image img = iconoOriginal.getImage().getScaledInstance(90, 90, Image.SCALE_SMOOTH);
        ImageIcon iconoRedimensionado = new ImageIcon(img);
        JLabel lblImagen = new JLabel(iconoRedimensionado);

        // Texto de la aplicación
        JLabel lblTexto = new JLabel("Versión 1 (Clásica)");
        lblTexto.setFont(new Font("Serif", Font.BOLD, 26));

        panelLogo.add(lblImagen);
        panelLogo.add(lblTexto);

        gbc.gridx = 0;
        gbc.gridy = 0;
        gbc.gridwidth = 2;
        panelTarjeta.add(panelLogo, gbc);

        // Usuario
        gbc.gridy = 1;
        gbc.gridwidth = 1;
        JLabel lblUsuario = new JLabel("Usuario:");
        lblUsuario.setFont(new Font("SansSerif", Font.PLAIN, 14));
        panelTarjeta.add(lblUsuario, gbc);

        gbc.gridx = 1;
        JTextField txtUsuario = new JTextField(15);
        txtUsuario.setFont(new Font("SansSerif", Font.PLAIN, 14));
        panelTarjeta.add(txtUsuario, gbc);


        // Contraseña
        gbc.gridx = 0;
        gbc.gridy = 2;
        JLabel lblPassword = new JLabel("Contraseña:");
        lblPassword.setFont(new Font("SansSerif", Font.PLAIN, 14));
        panelTarjeta.add(lblPassword, gbc);

        gbc.gridx = 1;
        JPasswordField txtPassword = new JPasswordField(15);
        txtPassword.setFont(new Font("SansSerif", Font.PLAIN, 14));
        panelTarjeta.add(txtPassword, gbc);

        // CheckBox
        gbc.gridx = 0;
        gbc.gridy = 3;
        gbc.gridwidth = 2;
        JCheckBox chkTerminos = new JCheckBox("Aceptar términos y condiciones");
        chkTerminos.setBackground(Color.WHITE);
        panelTarjeta.add(chkTerminos, gbc);

        // Botón
        gbc.gridy = 4;
        JButton btnAcceder = new JButton("Acceder");
        btnAcceder.setBackground(new Color(70, 130, 180)); // azul sobrio
        btnAcceder.setForeground(Color.WHITE);
        btnAcceder.setFocusPainted(false);
        btnAcceder.setFont(new Font("SansSerif", Font.BOLD, 14));
        panelTarjeta.add(btnAcceder, gbc);

        // Agregar tarjeta al fondo
        panelFondo.add(panelTarjeta);
        setContentPane(panelFondo);

        setVisible(true);
    }

    public static void main(String[] args) {

        SwingUtilities.invokeLater(BlocNotas::new);
    }
}


